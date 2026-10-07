import "server-only";
import {
  fromDbProfile, loadEntries, loadFullRow, recentChat, recentNotes,
} from "./db";
import { deriveFacts } from "./derive";
import { findUser } from "./users";
import {
  ARRAY_FIELDS, SCALAR_FIELDS, SECTION_FIELDS,
  type FormState, type Section,
} from "./schema";

const BUDGET_CHARS = 8000 * 4; // ~8,000 tokens

/** Treat user-authored text as data: defang anything shaped like our delimiter tags. */
export function defang(s: string) {
  return s.replace(/<\/?[a-zA-Z_][^>]{0,40}>/g, (m) => m.replace(/</g, "‹").replace(/>/g, "›"));
}

const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n) + "…" : s);

function compactProfile(form: FormState) {
  const out: Record<string, unknown> = {};
  for (const f of [...SCALAR_FIELDS, ...ARRAY_FIELDS]) {
    const v = (form as Record<string, unknown>)[f];
    if (v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0)) continue;
    out[f] = v;
  }
  return out;
}

function eduLine(e: Record<string, unknown>, i: number) {
  const yrs = [e.start_year, e.end_year].filter(Boolean).join("-");
  const grade = e.grade ? `${e.grade}${e.grade_type ? " " + e.grade_type : ""}` : "";
  return `${i + 1}. ${[e.degree || e.level, e.field_of_study, e.institution, e.university_board, yrs, e.status, grade]
    .filter(Boolean).join(", ")}`;
}

function expLine(e: Record<string, unknown>, i: number) {
  const when = `${e.start_date || "?"} to ${e.is_current ? "present" : e.end_date || "?"}`;
  const head = [e.job_title, e.company, when, e.location, e.work_mode, e.employment_type]
    .filter(Boolean).join(", ");
  const extra = [
    e.responsibilities && `Did: ${clip(String(e.responsibilities), 500)}`,
    e.achievements && `Achieved: ${clip(String(e.achievements), 300)}`,
    e.skills_used && `Skills: ${e.skills_used}`,
  ].filter(Boolean).join(" ");
  return `${i + 1}. ${head}. ${extra}`.trim();
}

export type ContextOpts = {
  liveForm?: Partial<FormState>;
  currentSection?: Section;
  includeMessages?: boolean; // false when the caller sends the chat turns itself
};

export async function buildCandidateContext(candidateId: string, opts: ContextOpts = {}) {
  // candidateId must come from the session cookie, never the request body.
  const user = findUser(candidateId);
  if (!user) throw new Error("Unknown candidate");
  const includeMessages = opts.includeMessages !== false;

  const [row, entries, notes, chat] = await Promise.all([
    loadFullRow(candidateId),
    loadEntries(candidateId),
    recentNotes(candidateId),
    includeMessages ? recentChat(candidateId, 12) : Promise.resolve([]),
  ]);

  // DB record, with the unsaved on-screen form merged over it for this request
  const db = fromDbProfile(row);
  const form: FormState = {
    ...db,
    ...entries,
    ...(opts.liveForm ?? {}),
  } as FormState;
  if (opts.liveForm?.education) form.education = opts.liveForm.education as FormState["education"];
  if (opts.liveForm?.experience) form.experience = opts.liveForm.experience as FormState["experience"];

  const facts = deriveFacts(form);
  const firstName = user.name.split(" ")[0];
  const today = new Date().toISOString().slice(0, 10);

  const head =
    `<candidate>\nname: ${user.name} | first_name: ${firstName} | id: ${user.id} | gender: ${form.gender || "not stated"} | today: ${today} | currency: ${form.currency || "INR"}\n</candidate>`;
  const profile = `<profile>${JSON.stringify(compactProfile(form))}</profile>`;
  const edu = `<education>\n${(form.education ?? []).map((e, i) => defang(eduLine(e as Record<string, unknown>, i))).join("\n") || "none yet"}\n</education>`;
  const exp = `<experience>\n${(form.experience ?? []).map((e, i) => defang(expLine(e as Record<string, unknown>, i))).join("\n") || "none yet"}\n</experience>`;
  const gapText = facts.gaps.filter((g) => g.months > 6).map((g) => `${g.months}m`).join(", ") || "none";
  const derived = `<derived>total_experience_computed: ${facts.hasDates ? facts.text : "unknown"} | current_role: ${facts.currentRole || "none"} | gaps_over_6m: ${gapText} | serving_notice: ${form.notice_period === "Currently serving notice" ? "yes" : "no"}</derived>`;

  // focus
  let focus = "";
  if (opts.currentSection) {
    const empty = SECTION_FIELDS[opts.currentSection].filter((f) => {
      const v = (form as Record<string, unknown>)[f];
      return v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);
    });
    focus = `<focus section="${opts.currentSection}" empty="${empty.join(",")}"/>`;
  }

  const resumeFull = String(row.resume_text ?? "");
  const summary = String(row.context_summary ?? "");

  // trimming levels: resume digest -> older notes -> raw chat. Identity/profile/entries are never dropped.
  const levels = [
    { resume: 6000, notesPer: 3, chat: 12 },
    { resume: 2500, notesPer: 2, chat: 8 },
    { resume: 800, notesPer: 1, chat: 4 },
    { resume: 0, notesPer: 1, chat: 0 },
  ];

  let text = "";
  for (const lv of levels) {
    const bySection = new Map<string, string[]>();
    for (const n of notes) {
      const arr = bySection.get(n.section) ?? [];
      if (arr.length < lv.notesPer) arr.push(clip(n.note, 1200));
      bySection.set(n.section, arr);
    }
    const notesText = [...bySection.entries()]
      .map(([s, arr]) => `<notes section="${s}">\n${arr.map(defang).join("\n---\n")}\n</notes>`)
      .join("\n");
    const resumeText = lv.resume && resumeFull
      ? `<resume_digest>${defang(clip(resumeFull, lv.resume))}</resume_digest>`
      : "";
    const msgs = chat.slice(-lv.chat).map((m) => `${m.role}: ${defang(clip(m.content, 500))}`).join("\n");
    const mem = (summary || msgs)
      ? `<conversation_memory>\n${summary ? defang(summary) + "\n" : ""}${msgs}\n</conversation_memory>`
      : "";
    text = [head, profile, edu, exp, derived, notesText, resumeText, mem, focus].filter(Boolean).join("\n");
    if (text.length <= BUDGET_CHARS) break;
  }
  return { text, tokenEstimate: Math.ceil(text.length / 4), form, facts, firstName };
}
