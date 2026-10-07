export const FIELD_LABELS: Record<string, string> = {
  full_name: "Full name", email: "Email", phone: "Phone", alt_phone: "Alternate phone",
  date_of_birth: "Date of birth", gender: "Gender", nationality: "Nationality",
  current_city: "Current city", current_state: "State", current_country: "Country",
  permanent_address: "Permanent address", willing_to_relocate: "Willing to relocate",
  notice_period: "Notice period", work_authorization: "Work authorization",
  skills: "Skills", languages: "Languages", certifications: "Certifications",
  total_experience: "Total experience",
  preferred_profiles: "Preferred profiles", preferred_job_titles: "Preferred job titles",
  preferred_industries: "Preferred industries", preferred_work_mode: "Preferred work mode",
  preferred_locations: "Preferred locations", employment_type_pref: "Employment type",
  currency: "Currency", current_ctc_fixed: "Current CTC (fixed)",
  current_ctc_variable: "Current CTC (variable)", current_ctc_total: "Current CTC (total)",
  expected_ctc_min: "Expected CTC (min)", expected_ctc_max: "Expected CTC (max)",
  ctc_negotiable: "Negotiable", linkedin_url: "LinkedIn", github_url: "GitHub",
  portfolio_url: "Portfolio", additional_notes: "Additional notes",
  level: "Level", degree: "Degree", field_of_study: "Field of study",
  institution: "Institution", university_board: "University / board",
  start_year: "Start year", end_year: "End year", status: "Status",
  grade_type: "Grade type", grade: "Grade", location: "Location",
  company: "Company", job_title: "Job title", employment_type: "Employment type",
  industry: "Industry", work_mode: "Work mode", start_date: "Start", end_date: "End",
  is_current: "Current role", reporting_to: "Reporting to", team_size: "Team size",
  responsibilities: "Responsibilities", achievements: "Achievements",
  skills_used: "Skills used", ctc_at_role: "CTC at role", reason_for_leaving: "Reason for leaving",
};

export const label = (k: string) =>
  FIELD_LABELS[k] ?? k.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
