import "server-only";
import { completionOf } from "./completion";
import {
  countChat, loadFullRow, loadForm, removeResume, sb,
} from "./db";
import { USERS, findUser } from "./users";
import { generateThankYou } from "./thankyou";
import { resolveCharacter, type StoredGuide } from "./characters";
import type { FormState } from "./schema";

type Row = Record<string, unknown>;

export type CandidateSummary = {
  id: string; name: string; status: "draft" | "submitted";
  updatedAt: string | null; submittedAt: string | null; percent: number;
  fullName: string; email: string; phone: string; city: string; experience: string;
  profiles: string[]; titles: string[]; skillsCount: number;
  educationCount: number; experienceCount: number;
  currency: string; ctcCurrent: number | null; ctcMin: number | null; ctcMax: number | null;
  hasResume: boolean; chatCount: number; character: string | null;
  signIns: number; failedSignIns: number; firstSignIn: string | null; lastSignIn: string | null;
};

const numOrNull = (v: unknown) => {
  const n = parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : null;
};

async function signInStats(id: string) {
  const { data } = await sb()
    .from("login_attempts").select("succeeded,created_at")
    .eq("candidate_id", id).order("created_at", { ascending: false }).limit(1000);
  const rows = (data ?? []) as { succeeded: boolean; created_at: string }[];
  const ok = rows.filter((r) => r.succeeded);
  return {
    signIns: ok.length,
    failedSignIns: rows.length - ok.length,
    lastSignIn: ok[0]?.created_at ?? null,
    firstSignIn: ok[ok.length - 1]?.created_at ?? null,
    recent: rows.slice(0, 25),
  };
}

async function summarise(id: string): Promise<CandidateSummary> {
  const user = findUser(id)!;
  const [{ form, status, updatedAt }, row, chatCount, si] = await Promise.all([
    loadForm(id), loadFullRow(id), countChat(id), signInStats(id),
  ]);
  const { percent } = completionOf(form);
  const ch = resolveCharacter(row.thankyou_character as string | null, row.thankyou_content as StoredGuide | null);
  return {
    id, name: user.name, status, updatedAt,
    submittedAt: (row.submitted_at as string) ?? null, percent,
    fullName: form.full_name ?? "", email: form.email ?? "", phone: form.phone ?? "",
    city: [form.current_city, form.current_country].filter(Boolean).join(", "),
    experience: form.total_experience ?? "",
    profiles: form.preferred_profiles ?? [], titles: form.preferred_job_titles ?? [],
    skillsCount: (form.skills ?? []).length,
    educationCount: (form.education ?? []).length, experienceCount: (form.experience ?? []).length,
    currency: form.currency || "INR",
    ctcCurrent: numOrNull(form.current_ctc_total), ctcMin: numOrNull(form.expected_ctc_min), ctcMax: numOrNull(form.expected_ctc_max),
    hasResume: !!form.resume_path, chatCount, character: ch?.name ?? null,
    signIns: si.signIns, failedSignIns: si.failedSignIns, firstSignIn: si.firstSignIn, lastSignIn: si.lastSignIn,
  };
}

export async function adminOverview() {
  const candidates = await Promise.all(USERS.map((u) => summarise(u.id)));
  const submitted = candidates.filter((c) => c.status === "submitted").length;
  const avg = Math.round(candidates.reduce((t, c) => t + c.percent, 0) / (candidates.length || 1));
  return {
    candidates,
    totals: {
      candidates: candidates.length, submitted, inProgress: candidates.length - submitted,
      avgCompletion: avg, withResume: candidates.filter((c) => c.hasResume).length,
      messages: candidates.reduce((t, c) => t + c.chatCount, 0),
      signIns: candidates.reduce((t, c) => t + c.signIns, 0),
    },
  };
}

export async function adminCandidate(id: string) {
  const [{ form, status, updatedAt, resume }, row, chat, notes, runs, si] = await Promise.all([
    loadForm(id),
    loadFullRow(id),
    sb().from("chat_messages").select("role,content,created_at").eq("candidate_id", id).order("id").limit(300),
    sb().from("step_notes").select("section,note,created_at").eq("candidate_id", id).order("created_at", { ascending: false }).limit(60),
    sb().from("assist_runs").select("kind,section,created_at").eq("candidate_id", id).order("created_at", { ascending: false }).limit(30),
    signInStats(id),
  ]);
  const { percent, missing } = completionOf(form);
  const ch = resolveCharacter(row.thankyou_character as string | null, row.thankyou_content as StoredGuide | null);
  return {
    id, name: findUser(id)!.name, status, updatedAt,
    submittedAt: (row.submitted_at as string) ?? null,
    percent, missing, form: form as FormState, resume,
    summary: (row.context_summary as string) ?? "",
    resumeChars: String(row.resume_text ?? "").length,
    thankyou: ch ? { character: ch.name, series: ch.series, content: row.thankyou_content as StoredGuide } : null,
    chat: (chat.data ?? []) as { role: string; content: string; created_at: string }[],
    notes: (notes.data ?? []) as { section: string; note: string; created_at: string }[],
    runs: (runs.data ?? []) as { kind: string; section: string | null; created_at: string }[],
    signIns: si,
  };
}

export type AdminAction = "reopen" | "mark_submitted" | "clear_chat" | "reset_profile" | "regenerate_thankyou";

export async function adminAct(id: string, action: AdminAction) {
  const db = sb();
  switch (action) {
    case "reopen": {
      const { error } = await db.from("profiles").update({ status: "draft" }).eq("candidate_id", id);
      if (error) throw new Error(error.message);
      return "Reopened for editing";
    }
    case "mark_submitted": {
      const { error } = await db.from("profiles").update({ status: "submitted", submitted_at: new Date().toISOString() }).eq("candidate_id", id);
      if (error) throw new Error(error.message);
      return "Marked as submitted";
    }
    case "clear_chat": {
      await db.from("chat_messages").delete().eq("candidate_id", id);
      await db.from("profiles").update({ context_summary: null, advisor_summary: null }).eq("candidate_id", id);
      return "Conversation cleared";
    }
    case "reset_profile": {
      await removeResume(id).catch(() => {});
      await db.from("profiles").delete().eq("candidate_id", id); // cascades entries, chat, notes, runs
      const { error } = await db.from("profiles").insert({ candidate_id: id });
      if (error) throw new Error(error.message);
      return "Profile reset";
    }
    case "regenerate_thankyou": {
      await generateThankYou(id);
      return "Thank-you note regenerated";
    }
  }
}

export async function adminActivity() {
  const [logins, runs] = await Promise.all([
    sb().from("login_attempts").select("candidate_id,succeeded,created_at").order("created_at", { ascending: false }).limit(40),
    sb().from("assist_runs").select("candidate_id,kind,section,created_at").order("created_at", { ascending: false }).limit(40),
  ]);
  return {
    logins: (logins.data ?? []) as { candidate_id: string; succeeded: boolean; created_at: string }[],
    runs: (runs.data ?? []) as { candidate_id: string; kind: string; section: string | null; created_at: string }[],
  };
}

const csvCell = (v: unknown) => {
  const s = Array.isArray(v) ? v.join("; ") : String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function adminExport() {
  const all = await Promise.all(USERS.map(async (u) => {
    const { form, status } = await loadForm(u.id);
    return { id: u.id, status, form };
  }));
  const scalar = Object.keys(all[0]?.form ?? {}).filter(
    (k) => !["education", "experience", "no_experience", "resume_path"].includes(k),
  );
  const head = ["candidate", "status", ...scalar, "education", "experience"];
  const lines = [head.join(",")];
  for (const c of all) {
    const f = c.form as unknown as Row;
    const edu = (c.form.education ?? []).map((e) => [e.degree, e.institution, e.end_year].filter(Boolean).join(" / ")).join(" | ");
    const exp = (c.form.experience ?? []).map((e) => [e.job_title, e.company, `${e.start_date ?? ""}..${e.is_current ? "present" : e.end_date ?? ""}`].filter(Boolean).join(" / ")).join(" | ");
    lines.push([c.id, c.status, ...scalar.map((k) => f[k]), edu, exp].map(csvCell).join(","));
  }
  return { csv: lines.join("\n"), json: all };
}
