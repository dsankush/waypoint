import {
  ARRAY_FIELDS, SCALAR_FIELDS, EMPTY_FORM,
  type FormState,
} from "./schema";

const MAX_STR = 5000;
const clipStr = (v: unknown, n = MAX_STR) => String(v ?? "").slice(0, n);

const EDU_KEYS = [
  "level", "degree", "field_of_study", "institution", "university_board",
  "start_year", "end_year", "status", "grade_type", "grade", "location",
];
const EXP_KEYS = [
  "company", "job_title", "employment_type", "industry", "location", "work_mode",
  "start_date", "end_date", "reporting_to", "team_size", "responsibilities",
  "achievements", "skills_used", "ctc_at_role", "reason_for_leaving",
];

/** Whitelist known fields and cap sizes. Never trust the browser's shape. */
export function sanitizeForm(input: unknown): FormState {
  const src = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const out: Record<string, unknown> = { ...EMPTY_FORM };
  for (const f of SCALAR_FIELDS) {
    if (f in src) out[f] = clipStr(src[f]);
  }
  for (const f of ARRAY_FIELDS) {
    const v = src[f];
    out[f] = Array.isArray(v) ? v.slice(0, 60).map((x) => clipStr(x, 200)).filter(Boolean) : [];
  }
  const list = (v: unknown, keys: string[], bools: string[] = []) =>
    (Array.isArray(v) ? v.slice(0, 30) : []).map((e) => {
      const o = (e && typeof e === "object" ? e : {}) as Record<string, unknown>;
      const r: Record<string, unknown> = {};
      for (const k of keys) if (k in o) r[k] = clipStr(o[k]);
      for (const k of bools) r[k] = !!o[k];
      return r;
    });
  out.education = list(src.education, EDU_KEYS);
  out.experience = list(src.experience, EXP_KEYS, ["is_current"]);
  out.no_experience = !!src.no_experience;
  return out as unknown as FormState;
}
