import { validateFull, type FormState } from "./schema";

export const REQUIRED_TOP = [
  "full_name", "email", "phone", "current_city", "current_country", "willing_to_relocate",
  "notice_period", "total_experience", "skills", "preferred_profiles", "preferred_job_titles",
  "preferred_work_mode", "current_ctc_total", "expected_ctc_min", "linkedin_url", "education",
];

export function completionOf(form: FormState) {
  const errors = validateFull(form);
  const bad = new Set(Object.keys(errors).map((k) => k.split(".")[0]));
  const missing = REQUIRED_TOP.filter((r) => bad.has(r));
  const percent = Math.round(((REQUIRED_TOP.length - missing.length) / REQUIRED_TOP.length) * 100);
  return { percent, missing, errors };
}
