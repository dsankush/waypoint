import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  ARRAY_FIELDS, EMPTY_FORM, SCALAR_FIELDS,
  type FormState, type Section,
} from "./schema";

let client: SupabaseClient | null = null;
export function sb(): SupabaseClient {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Database is not configured");
    client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return client;
}

function fail(where: string, error: { message: string } | null) {
  if (error) throw new Error(`${where}: ${error.message}`);
}

/* ------------------------------------------------------------------ */
/* Mapping helpers                                                     */
/* ------------------------------------------------------------------ */

const FORM_COLUMNS = [
  "candidate_id", "status", "submitted_at", "updated_at",
  ...SCALAR_FIELDS, ...ARRAY_FIELDS,
  "resume_path", "resume_file_name",
].join(",");

const NUMERIC_FIELDS = new Set([
  "current_ctc_fixed", "current_ctc_variable", "current_ctc_total",
  "expected_ctc_min", "expected_ctc_max",
]);

function num(v: unknown): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = parseFloat(String(v).replace(/,/g, ""));
  if (!Number.isFinite(n) || Math.abs(n) >= 1e10) return null;
  return n;
}
function str(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}
function oneOf(v: unknown, allowed: string[]): string | null {
  const s = str(v);
  return s && allowed.includes(s) ? s : null;
}
function yearOf(v: unknown): string {
  const s = String(v ?? "").trim();
  return /^\d{4}$/.test(s) ? s : "";
}
function monthToDate(v: unknown): string {
  const s = String(v ?? "").trim();
  if (/^\d{4}-\d{2}$/.test(s)) return `${s}-01`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return "";
}

export function toDbProfile(form: Partial<FormState>) {
  const row: Record<string, unknown> = {};
  for (const f of SCALAR_FIELDS) {
    const v = (form as Record<string, unknown>)[f];
    if (v === undefined) continue;
    if (NUMERIC_FIELDS.has(f)) row[f] = num(v);
    else if (f === "date_of_birth") {
      const s = str(v);
      row[f] = s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) ? s : null;
    } else if (f === "willing_to_relocate") row[f] = oneOf(v, ["Yes", "No", "Maybe"]);
    else if (f === "ctc_negotiable") row[f] = oneOf(v, ["Yes", "No"]);
    else if (f === "currency") row[f] = str(v) ?? "INR";
    else row[f] = str(v);
  }
  for (const f of ARRAY_FIELDS) {
    const v = (form as Record<string, unknown>)[f];
    if (v === undefined) continue;
    row[f] = Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean) : [];
  }
  return row;
}

export function toDbEducation(list: FormState["education"]) {
  return (list ?? [])
    .filter((e) => Object.values(e).some((v) => v !== undefined && v !== null && String(v).trim() !== ""))
    .map((e) => ({
      level: e.level ?? "",
      degree: e.degree ?? "",
      field_of_study: e.field_of_study ?? "",
      institution: e.institution ?? "",
      university_board: e.university_board ?? "",
      start_year: yearOf(e.start_year),
      end_year: yearOf(e.end_year),
      status: oneOf(e.status, ["Completed", "Pursuing", "Discontinued"]) ?? "",
      grade_type: e.grade_type ?? "",
      grade: e.grade ?? "",
      location: e.location ?? "",
    }));
}

export function toDbExperience(list: FormState["experience"]) {
  return (list ?? [])
    .filter((e) =>
      Object.entries(e).some(
        ([k, v]) => k !== "is_current" && v !== undefined && v !== null && String(v).trim() !== "",
      ),
    )
    .map((e) => ({
      company: e.company ?? "",
      job_title: e.job_title ?? "",
      employment_type: e.employment_type ?? "",
      industry: e.industry ?? "",
      location: e.location ?? "",
      work_mode: oneOf(e.work_mode, ["Onsite", "Hybrid", "Remote"]) ?? "",
      start_date: monthToDate(e.start_date),
      end_date: e.is_current ? "" : monthToDate(e.end_date),
      is_current: !!e.is_current,
      reporting_to: e.reporting_to ?? "",
      team_size: e.team_size ?? "",
      responsibilities: e.responsibilities ?? "",
      achievements: e.achievements ?? "",
      skills_used: e.skills_used ?? "",
      ctc_at_role: num(e.ctc_at_role)?.toString() ?? "",
      reason_for_leaving: e.reason_for_leaving ?? "",
    }));
}

type Row = Record<string, unknown>;

function fromDbProfile(row: Row): FormState {
  const form: Row = { ...EMPTY_FORM };
  for (const f of SCALAR_FIELDS) {
    const v = row[f];
    form[f] = v === null || v === undefined ? "" : String(v);
  }
  if (!form.currency) form.currency = "INR";
  for (const f of ARRAY_FIELDS) form[f] = Array.isArray(row[f]) ? row[f] : [];
  form.resume_path = row.resume_path ?? undefined;
  form.resume_file_name = row.resume_file_name ?? undefined;
  return form as unknown as FormState;
}

function fromDbEducation(rows: Row[]): FormState["education"] {
  return rows.map((r) => ({
    level: (r.level as string) ?? "",
    degree: (r.degree as string) ?? "",
    field_of_study: (r.field_of_study as string) ?? "",
    institution: (r.institution as string) ?? "",
    university_board: (r.university_board as string) ?? "",
    start_year: r.start_year == null ? "" : String(r.start_year),
    end_year: r.end_year == null ? "" : String(r.end_year),
    status: (r.status as "Completed") ?? undefined,
    grade_type: (r.grade_type as "Percentage") ?? undefined,
    grade: (r.grade as string) ?? "",
    location: (r.location as string) ?? "",
  }));
}

function fromDbExperience(rows: Row[]): FormState["experience"] {
  return rows.map((r) => ({
    company: (r.company as string) ?? "",
    job_title: (r.job_title as string) ?? "",
    employment_type: (r.employment_type as string) ?? "",
    industry: (r.industry as string) ?? "",
    location: (r.location as string) ?? "",
    work_mode: (r.work_mode as "Onsite") ?? undefined,
    start_date: r.start_date ? String(r.start_date).slice(0, 7) : "",
    end_date: r.end_date ? String(r.end_date).slice(0, 7) : "",
    is_current: !!r.is_current,
    reporting_to: (r.reporting_to as string) ?? "",
    team_size: (r.team_size as string) ?? "",
    responsibilities: (r.responsibilities as string) ?? "",
    achievements: (r.achievements as string) ?? "",
    skills_used: (r.skills_used as string) ?? "",
    ctc_at_role: r.ctc_at_role == null ? "" : String(r.ctc_at_role),
    reason_for_leaving: (r.reason_for_leaving as string) ?? "",
  }));
}

/* ------------------------------------------------------------------ */
/* Profile                                                             */
/* ------------------------------------------------------------------ */

export async function loadEntries(id: string) {
  const [edu, exp] = await Promise.all([
    sb().from("education_entries").select("*").eq("candidate_id", id).order("entry_no"),
    sb().from("experience_entries").select("*").eq("candidate_id", id).order("entry_no"),
  ]);
  fail("load education", edu.error);
  fail("load experience", exp.error);
  return {
    education: fromDbEducation((edu.data ?? []) as Row[]),
    experience: fromDbExperience((exp.data ?? []) as Row[]),
  };
}

/** Form-safe load: never selects resume_text, context_summary or thankyou_*. */
export async function loadForm(id: string) {
  const [p, entries] = await Promise.all([
    sb().from("profiles").select(FORM_COLUMNS).eq("candidate_id", id).single(),
    loadEntries(id),
  ]);
  fail("load profile", p.error);
  const row = p.data as unknown as Row;
  const form = { ...fromDbProfile(row), ...entries };
  let resume: { name: string; url: string | null } | null = null;
  if (form.resume_path) {
    const { data } = await sb().storage.from("resumes").createSignedUrl(form.resume_path, 3600);
    resume = { name: form.resume_file_name ?? "Resume", url: data?.signedUrl ?? null };
  }
  return {
    form,
    status: row.status as "draft" | "submitted",
    updatedAt: row.updated_at as string,
    resume,
  };
}

export async function saveForm(id: string, form: FormState, submit: boolean) {
  const row = {
    candidate_id: id,
    ...toDbProfile(form),
    status: submit ? "submitted" : "draft",
    submitted_at: submit ? new Date().toISOString() : undefined,
  };
  const { error } = await sb().from("profiles").upsert(row, { onConflict: "candidate_id" });
  fail("save profile", error);
  const { error: e2 } = await sb().rpc("replace_entries", {
    p_candidate: id,
    p_education: toDbEducation(form.education),
    p_experience: toDbExperience(form.no_experience ? [] : form.experience),
  });
  fail("save entries", e2);
  return new Date().toISOString();
}

/** Full row including server-only columns (context builder / thank-you only). */
export async function loadFullRow(id: string): Promise<Row> {
  const { data, error } = await sb().from("profiles").select("*").eq("candidate_id", id).single();
  fail("load full profile", error);
  return data as Row;
}

export { fromDbProfile };

/* ------------------------------------------------------------------ */
/* Resume                                                              */
/* ------------------------------------------------------------------ */

export async function storeResume(
  id: string, fileName: string, contentType: string, bytes: Buffer, text: string | null,
) {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80) || "resume";
  const path = `${id}/${Date.now()}-${safe}`;
  const { data: prev } = await sb().from("profiles").select("resume_path").eq("candidate_id", id).single();
  const up = await sb().storage.from("resumes").upload(path, bytes, { contentType, upsert: false });
  fail("upload resume", up.error);
  const { error } = await sb().from("profiles").update({
    resume_path: path, resume_file_name: fileName, resume_text: text,
  }).eq("candidate_id", id);
  fail("save resume", error);
  const oldPath = (prev as Row | null)?.resume_path as string | undefined;
  if (oldPath) await sb().storage.from("resumes").remove([oldPath]);
  const { data } = await sb().storage.from("resumes").createSignedUrl(path, 3600);
  return { fileName, signedUrl: data?.signedUrl ?? null };
}

export async function removeResume(id: string) {
  const { data } = await sb().from("profiles").select("resume_path").eq("candidate_id", id).single();
  const path = (data as Row | null)?.resume_path as string | undefined;
  if (path) await sb().storage.from("resumes").remove([path]);
  const { error } = await sb().from("profiles").update({
    resume_path: null, resume_file_name: null, resume_text: null,
  }).eq("candidate_id", id);
  fail("remove resume", error);
}

/* ------------------------------------------------------------------ */
/* Chat, notes, runs, logins, summary                                   */
/* ------------------------------------------------------------------ */

export type ChatMsg = { role: "user" | "assistant"; content: string };

export async function recentChat(id: string, limit: number): Promise<ChatMsg[]> {
  const { data, error } = await sb()
    .from("chat_messages").select("role,content")
    .eq("candidate_id", id).order("id", { ascending: false }).limit(limit);
  fail("load chat", error);
  return ((data ?? []) as ChatMsg[]).reverse();
}

export async function addChat(id: string, role: "user" | "assistant", content: string) {
  const { error } = await sb().from("chat_messages").insert({ candidate_id: id, role, content });
  fail("save chat", error);
}

export async function countChat(id: string) {
  const { count, error } = await sb()
    .from("chat_messages").select("id", { count: "exact", head: true }).eq("candidate_id", id);
  fail("count chat", error);
  return count ?? 0;
}

export async function addNote(id: string, section: Section, note: string) {
  const { error } = await sb().from("step_notes").insert({ candidate_id: id, section, note });
  fail("save note", error);
}

export async function recentNotes(id: string) {
  const { data, error } = await sb()
    .from("step_notes").select("section,note,created_at")
    .eq("candidate_id", id).order("created_at", { ascending: false }).limit(60);
  fail("load notes", error);
  return (data ?? []) as { section: Section; note: string; created_at: string }[];
}

export async function logRun(id: string, kind: string, section?: string, chars?: number) {
  await sb().from("assist_runs").insert({
    candidate_id: id, kind, section: section ?? null, input_chars: chars ?? null,
  });
}

export async function countRuns(id: string, kinds: string[], sinceMs: number) {
  const since = new Date(Date.now() - sinceMs).toISOString();
  const { count, error } = await sb()
    .from("assist_runs").select("id", { count: "exact", head: true })
    .eq("candidate_id", id).in("kind", kinds).gte("created_at", since);
  fail("count runs", error);
  return count ?? 0;
}

export async function failedLogins(id: string, sinceMs: number) {
  const since = new Date(Date.now() - sinceMs).toISOString();
  const { count, error } = await sb()
    .from("login_attempts").select("id", { count: "exact", head: true })
    .eq("candidate_id", id).eq("succeeded", false).gte("created_at", since);
  fail("count logins", error);
  return count ?? 0;
}

export async function logLogin(id: string, succeeded: boolean) {
  await sb().from("login_attempts").insert({ candidate_id: id, succeeded });
}

export async function setContextSummary(id: string, summary: string) {
  const { error } = await sb().from("profiles").update({
    context_summary: summary, context_updated_at: new Date().toISOString(),
    advisor_summary: summary,
  }).eq("candidate_id", id);
  fail("save summary", error);
}

export async function getThankYouRow(id: string) {
  const { data, error } = await sb()
    .from("profiles")
    .select("status,thankyou_character,thankyou_content,thankyou_generated_at,submitted_at")
    .eq("candidate_id", id).single();
  fail("load thank-you", error);
  return data as Row;
}

export async function setThankYou(id: string, character: string, content: unknown) {
  const { error } = await sb().from("profiles").update({
    thankyou_character: character, thankyou_content: content,
    thankyou_generated_at: new Date().toISOString(),
  }).eq("candidate_id", id);
  fail("save thank-you", error);
}

/** Consecutive days (ending today) with a successful sign-in. */
export async function loginStreak(id: string) {
  const since = new Date(Date.now() - 45 * 86400000).toISOString();
  const { data } = await sb()
    .from("login_attempts").select("created_at")
    .eq("candidate_id", id).eq("succeeded", true).gte("created_at", since)
    .order("created_at", { ascending: false }).limit(400);
  const day = (d: Date) => d.toLocaleDateString("en-CA"); // YYYY-MM-DD, server local time
  const days = new Set(((data ?? []) as { created_at: string }[]).map((r) => day(new Date(r.created_at))));
  let streak = 0;
  const cur = new Date();
  while (days.has(day(cur))) { streak++; cur.setDate(cur.getDate() - 1); }
  return { streak, totalDays: days.size };
}
