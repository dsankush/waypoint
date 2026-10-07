export const GENDER = ["Female", "Male", "Non-binary", "Prefer not to say"];
export const NOTICE_PERIOD = [
  "Immediate", "15 days", "30 days", "45 days", "60 days", "90 days",
  "More than 90 days", "Currently serving notice",
];
export const TOTAL_EXPERIENCE = [
  "Fresher", "Less than 1 year", "1-2 years", "2-3 years", "3-5 years",
  "5-8 years", "8-12 years", "12-15 years", "15+ years",
];
export const WORK_AUTH = ["Indian citizen", "Work visa holder", "Need sponsorship", "Other"];
export const EDU_LEVEL = [
  "Secondary (10th)", "Higher Secondary (12th)", "Diploma", "Bachelor's", "Master's",
  "MBA/PGDM", "Doctorate", "Professional Certification",
];
export const DEGREE = [
  "B.Tech", "B.E.", "B.Sc", "B.Com", "BBA", "BCA", "BA", "B.Des", "LLB", "MBBS", "B.Pharm",
  "M.Tech", "M.Sc", "M.Com", "MBA", "MCA", "MA", "M.Des", "LLM", "CA", "CS", "CMA", "PhD",
  "Diploma in Engineering", "Other",
];
export const EDU_STATUS = ["Completed", "Pursuing", "Discontinued"];
export const GRADE_TYPE = ["Percentage", "CGPA (10)", "CGPA (4)", "Grade"];
export const EMPLOYMENT_TYPE = [
  "Full-time", "Part-time", "Contract", "Freelance", "Internship", "Apprenticeship",
];
export const WORK_MODE = ["Onsite", "Hybrid", "Remote"];
export const INDUSTRY = [
  "Information Technology", "Software Products", "Banking & Finance", "Insurance", "Healthcare",
  "Pharma", "Education", "E-commerce", "Retail", "Manufacturing", "Automobile", "Telecom",
  "Media & Entertainment", "Consulting", "Logistics", "Real Estate", "Construction", "Energy",
  "Hospitality", "Government", "Non-profit", "Other",
];
export const PROFILES = [
  "Software Engineering", "Frontend", "Backend", "Full Stack", "Mobile", "DevOps / Cloud",
  "Data Engineering", "Data Science / ML", "Data Analytics", "QA / Testing", "Cybersecurity",
  "Product Management", "Project / Program Management", "UI/UX Design", "Graphic Design",
  "Digital Marketing", "Content & Copywriting", "SEO / SEM", "Sales", "Business Development",
  "Customer Success", "Operations", "Supply Chain", "HR / Talent Acquisition",
  "Finance & Accounting", "Legal & Compliance", "Administration", "Teaching / Training",
  "Healthcare", "Engineering (Core)", "Other",
];
export const LOCATIONS = [
  "Bengaluru", "Hyderabad", "Pune", "Mumbai", "Delhi NCR", "Chennai", "Kolkata", "Ahmedabad",
  "Jaipur", "Chandigarh", "Indore", "Kochi", "Lucknow", "Nagpur", "Coimbatore", "Bhubaneswar",
  "Remote (India)", "Abroad",
];
export const CURRENCY = ["INR", "USD", "EUR", "GBP", "AED"];
export const CURRENCY_LABEL: Record<string, string> = {
  INR: "LPA", USD: "USD / year", EUR: "EUR / year", GBP: "GBP / year", AED: "AED / year",
};
export const COUNTRIES = [
  "India", "United States", "United Kingdom", "Canada", "Australia", "Germany", "France",
  "Singapore", "United Arab Emirates", "Netherlands", "Ireland", "New Zealand", "Other",
];
export const STATES_IN = [
  "Andhra Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh", "Delhi", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Odisha", "Punjab", "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Other",
];
export const LANGUAGES = [
  "Hindi", "English", "Marathi", "Gujarati", "Bengali", "Tamil", "Telugu", "Kannada",
  "Malayalam", "Punjabi", "Urdu", "Other",
];
export const PROFICIENCY = ["Basic", "Fluent", "Native"];

export const TITLE_SUGGESTIONS: Record<string, string[]> = {
  Backend: ["Backend Engineer", "Senior Backend Engineer", "API Developer"],
  Frontend: ["Frontend Engineer", "UI Engineer"],
  "Full Stack": ["Full Stack Developer", "Software Engineer"],
  "Data Engineering": ["Data Engineer", "Analytics Engineer"],
  "Data Science / ML": ["Data Scientist", "ML Engineer"],
  "Data Analytics": ["Data Analyst", "Business Analyst"],
  "DevOps / Cloud": ["DevOps Engineer", "Cloud Engineer", "SRE"],
  "Product Management": ["Product Manager", "Associate Product Manager"],
  "UI/UX Design": ["Product Designer", "UX Designer"],
  "Digital Marketing": ["Digital Marketing Manager", "Growth Marketer"],
  Sales: ["Sales Executive", "Account Executive"],
};

/** All dropdown-type values the models may use, keyed by form field. */
export const OPTIONS_BY_FIELD: Record<string, string[]> = {
  gender: GENDER,
  notice_period: NOTICE_PERIOD,
  total_experience: TOTAL_EXPERIENCE,
  work_authorization: WORK_AUTH,
  willing_to_relocate: ["Yes", "No", "Maybe"],
  preferred_profiles: PROFILES,
  preferred_industries: INDUSTRY,
  preferred_work_mode: WORK_MODE,
  preferred_locations: LOCATIONS,
  employment_type_pref: EMPLOYMENT_TYPE,
  currency: CURRENCY,
  ctc_negotiable: ["Yes", "No"],
};

export const ENTRY_OPTIONS: Record<string, Record<string, string[]>> = {
  education: {
    level: EDU_LEVEL, degree: DEGREE, status: EDU_STATUS, grade_type: GRADE_TYPE,
  },
  experience: {
    employment_type: EMPLOYMENT_TYPE, industry: INDUSTRY, work_mode: WORK_MODE,
  },
};
