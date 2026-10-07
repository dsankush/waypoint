import { z } from "zod";

export const education = z.object({
  level: z.string().min(1),
  degree: z.string().min(1),
  field_of_study: z.string().optional(),
  institution: z.string().min(1),
  university_board: z.string().optional(),
  start_year: z.string().optional(),
  end_year: z.string().optional(),
  status: z.enum(["Completed", "Pursuing", "Discontinued"]),
  grade_type: z.enum(["Percentage", "CGPA (10)", "CGPA (4)", "Grade"]).optional(),
  grade: z.string().optional(),
  location: z.string().optional(),
});

export const experience = z.object({
  company: z.string().min(1),
  job_title: z.string().min(1),
  employment_type: z.string().min(1),
  industry: z.string().optional(),
  location: z.string().optional(),
  work_mode: z.enum(["Onsite", "Hybrid", "Remote"]).optional(),
  start_date: z.string().min(1),
  end_date: z.string().optional(),
  is_current: z.boolean().default(false),
  reporting_to: z.string().optional(),
  team_size: z.string().optional(),
  responsibilities: z.string().min(1),
  achievements: z.string().optional(),
  skills_used: z.string().optional(),
  ctc_at_role: z.string().optional(),
  reason_for_leaving: z.string().optional(),
});

export const profile = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  alt_phone: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.string().optional(),
  nationality: z.string().optional(),
  current_city: z.string().min(1),
  current_state: z.string().optional(),
  current_country: z.string().min(1),
  permanent_address: z.string().optional(),
  willing_to_relocate: z.enum(["Yes", "No", "Maybe"]),
  notice_period: z.string().min(1),
  work_authorization: z.string().optional(),

  total_experience: z.string().min(1),
  skills: z.array(z.string()).min(1),
  languages: z.array(z.string()).optional(),
  certifications: z.string().optional(),

  preferred_profiles: z.array(z.string()).min(1),
  preferred_job_titles: z.array(z.string()).min(1),
  preferred_industries: z.array(z.string()).optional(),
  preferred_work_mode: z.array(z.string()).min(1),
  preferred_locations: z.array(z.string()).optional(),
  employment_type_pref: z.array(z.string()).optional(),

  currency: z.string().default("INR"),
  current_ctc_fixed: z.string().optional(),
  current_ctc_variable: z.string().optional(),
  current_ctc_total: z
    .string()
    .min(1)
    .refine((v) => Number.isFinite(Number(v)) && Number(v) >= 0, "Enter a valid number"),
  expected_ctc_min: z
    .string()
    .min(1)
    .refine((v) => Number.isFinite(Number(v)) && Number(v) > 0, "Enter a positive number"),
  expected_ctc_max: z.string().optional(),
  ctc_negotiable: z.enum(["Yes", "No"]).optional(),

  linkedin_url: z
    .string()
    .url()
    .refine((v) => v.includes("linkedin.com"), "Enter a valid LinkedIn URL"),
  github_url: z.string().url().optional().or(z.literal("")),
  portfolio_url: z.string().url().optional().or(z.literal("")),

  resume_path: z.string().optional(),
  resume_file_name: z.string().optional(),

  additional_notes: z.string().optional(),

  education: z.array(education).min(1),
  experience: z.array(experience),
});

export type Profile = z.input<typeof profile>;
export type EducationEntry = z.input<typeof education>;
export type ExperienceEntry = z.input<typeof experience>;

/** Loose shape held by the form (drafts may be partial). */
export type FormState = Partial<Omit<Profile, "education" | "experience">> & {
  education: Partial<EducationEntry>[];
  experience: Partial<ExperienceEntry>[];
  no_experience?: boolean;
};

export const SECTIONS = [
  "personal", "education", "experience", "skills",
  "preferences", "compensation", "links", "review",
] as const;
export type Section = (typeof SECTIONS)[number];

export const SECTION_LABEL: Record<Section, string> = {
  personal: "Personal",
  education: "Education",
  experience: "Experience",
  skills: "Skills",
  preferences: "Preferences",
  compensation: "Compensation",
  links: "Links & Resume",
  review: "Review",
};

export const sectionSchemas = {
  personal: profile.pick({
    full_name: true, email: true, phone: true, alt_phone: true, date_of_birth: true,
    gender: true, nationality: true, current_city: true, current_state: true,
    current_country: true, permanent_address: true, willing_to_relocate: true,
    notice_period: true, work_authorization: true,
  }),
  education: z.object({ education: z.array(education) }),
  experience: z.object({ experience: z.array(experience) }),
  skills: profile.pick({
    skills: true, languages: true, certifications: true, total_experience: true,
  }),
  preferences: profile.pick({
    preferred_profiles: true, preferred_job_titles: true, preferred_industries: true,
    preferred_work_mode: true, preferred_locations: true, employment_type_pref: true,
  }),
  compensation: profile.pick({
    currency: true, current_ctc_fixed: true, current_ctc_variable: true,
    current_ctc_total: true, expected_ctc_min: true, expected_ctc_max: true,
    ctc_negotiable: true,
  }),
  links: profile.pick({ linkedin_url: true, github_url: true, portfolio_url: true }),
  review: profile.pick({ additional_notes: true }),
};

export const SECTION_FIELDS: Record<Section, string[]> = {
  personal: Object.keys(sectionSchemas.personal.shape),
  education: ["education"],
  experience: ["experience"],
  skills: Object.keys(sectionSchemas.skills.shape),
  preferences: Object.keys(sectionSchemas.preferences.shape),
  compensation: Object.keys(sectionSchemas.compensation.shape),
  links: Object.keys(sectionSchemas.links.shape),
  review: ["additional_notes"],
};

export const FIELD_SECTION: Record<string, Section> = Object.fromEntries(
  (Object.keys(SECTION_FIELDS) as Section[]).flatMap((s) =>
    SECTION_FIELDS[s].map((f) => [f, s] as const),
  ),
);

export const ARRAY_FIELDS = [
  "skills", "languages", "preferred_profiles", "preferred_job_titles",
  "preferred_industries", "preferred_work_mode", "preferred_locations",
  "employment_type_pref",
] as const;

export const SCALAR_FIELDS = Object.keys(profile.shape).filter(
  (k) =>
    !(ARRAY_FIELDS as readonly string[]).includes(k) &&
    k !== "education" &&
    k !== "experience" &&
    k !== "resume_path" &&
    k !== "resume_file_name",
);

export const EMPTY_FORM: FormState = {
  currency: "INR",
  skills: [],
  languages: [],
  preferred_profiles: [],
  preferred_job_titles: [],
  preferred_industries: [],
  preferred_work_mode: [],
  preferred_locations: [],
  employment_type_pref: [],
  education: [],
  experience: [],
};

/** Strip UI-only flags and blank strings before validating. */
export function cleanForValidation(f: FormState) {
  const { no_experience: _ignored, ...rest } = f;
  void _ignored;
  const strip = <T extends Record<string, unknown>>(o: T) =>
    Object.fromEntries(
      Object.entries(o).filter(([, v]) => v !== "" && v !== null && v !== undefined),
    );
  return {
    ...strip(rest),
    education: (f.education ?? []).map((e) => strip(e as Record<string, unknown>)),
    experience: (f.experience ?? []).map((e) => strip(e as Record<string, unknown>)),
  };
}

export type FieldErrors = Record<string, string>;

/** Full validation; returns flat map: "full_name" -> msg, "experience.0.company" -> msg */
export function validateFull(f: FormState): FieldErrors {
  const data = cleanForValidation(f);
  if (f.no_experience) data.experience = [];
  const res = profile.safeParse(data);
  if (res.success) return {};
  const out: FieldErrors = {};
  for (const issue of res.error.issues) {
    const key = issue.path.join(".");
    if (out[key]) continue;
    const field = String(issue.path[issue.path.length - 1] ?? "");
    let msg = issue.message;
    if (issue.code === "invalid_type") msg = "Required";
    else if (issue.code === "too_small" && Number(issue.minimum) <= 1) msg = "Required";
    else if (issue.code === "too_small" && field === "phone") msg = "Enter a valid phone number";
    else if (issue.code === "too_small" && field === "full_name") msg = "Please enter your full name";
    else if (issue.code === "invalid_string" && issue.validation === "email") msg = "Enter a valid email address";
    else if (issue.code === "invalid_string" && issue.validation === "url") msg = "Enter a full link starting with https://";
    else if (issue.code === "invalid_enum_value") msg = "Please choose an option";
    out[key] = msg;
  }
  return out;
}

export function sectionOfError(key: string): Section {
  return FIELD_SECTION[key.split(".")[0]] ?? "review";
}

