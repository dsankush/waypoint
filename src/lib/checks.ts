import { SECTION_LABEL, sectionOfError, validateFull, type FormState, type Section } from "./schema";
import { TOTAL_EXPERIENCE } from "./options";
import { deriveFacts, fmtMonths, idxToLabel } from "./derive";

export type Issue = {
  severity: "error" | "warning" | "info";
  section: Section;
  message: string;
};

const LABELS: Record<string, string> = {
  full_name: "full name", email: "email", phone: "phone", current_city: "current city",
  current_country: "country", willing_to_relocate: "willingness to relocate",
  notice_period: "notice period", total_experience: "total experience", skills: "skills",
  preferred_profiles: "preferred profiles", preferred_job_titles: "preferred job titles",
  preferred_work_mode: "preferred work mode", current_ctc_total: "current CTC",
  expected_ctc_min: "expected CTC", linkedin_url: "LinkedIn URL", github_url: "GitHub URL",
  portfolio_url: "portfolio URL", education: "at least one education entry",
};

function entryLabel(key: string) {
  const [kind, idx, field] = key.split(".");
  const n = Number(idx) + 1;
  return `${kind === "education" ? "Education" : "Experience"} ${n}: ${(field ?? "").replace(/_/g, " ")}`;
}

export function codeChecks(form: FormState): Issue[] {
  const issues: Issue[] = [];

  // missing / invalid required fields, grouped by step
  const errs = validateFull(form);
  const bySection = new Map<Section, string[]>();
  for (const [key, msg] of Object.entries(errs)) {
    const sec = sectionOfError(key);
    const top = key.split(".")[0];
    const label = key.includes(".")
      ? entryLabel(key)
      : LABELS[top] ?? top.replace(/_/g, " ");
    const text = msg === "Required" ? label : `${label} (${msg.toLowerCase()})`;
    bySection.set(sec, [...(bySection.get(sec) ?? []), text]);
  }
  for (const [section, list] of bySection) {
    issues.push({
      severity: "error",
      section,
      message: `${SECTION_LABEL[section]}: still needed or invalid: ${list.join(", ")}.`,
    });
  }

  // experience dates
  const exp = form.no_experience ? [] : form.experience ?? [];
  exp.forEach((e, i) => {
    if (e.start_date && e.end_date && !e.is_current && e.end_date < e.start_date) {
      issues.push({
        severity: "error", section: "experience",
        message: `Experience ${i + 1} ends before it starts. Please check the dates.`,
      });
    }
    if (e.company && (e.responsibilities ?? "").trim().length > 0 && (e.responsibilities ?? "").trim().length < 40) {
      issues.push({
        severity: "info", section: "experience",
        message: `Experience ${i + 1} (${e.company}) has a very short description. A few lines on what you did helps recruiters.`,
      });
    }
  });
  const facts = deriveFacts({ experience: exp });
  for (const [a, b] of facts.overlaps) {
    issues.push({
      severity: "info", section: "experience",
      message: `${a.label} (to ${idxToLabel(a.end)}) overlaps with ${b.label} (from ${idxToLabel(b.start)}). That is fine if intended, such as a part-time role.`,
    });
  }
  for (const g of facts.gaps) {
    if (g.months > 6) {
      issues.push({
        severity: "info", section: "experience",
        message: `There is a gap of about ${fmtMonths(g.months)} between ${idxToLabel(g.from)} and ${idxToLabel(g.to)}. You may add a short note about it under Review if you like.`,
      });
    }
  }

  // total experience vs dates
  if (facts.hasDates && form.total_experience) {
    const a = TOTAL_EXPERIENCE.indexOf(form.total_experience);
    const b = TOTAL_EXPERIENCE.indexOf(facts.bucket);
    if (a >= 0 && b >= 0 && Math.abs(a - b) >= 1) {
      issues.push({
        severity: "warning", section: "skills",
        message: `Total experience says "${form.total_experience}", but your experience dates add up to about ${facts.text} ("${facts.bucket}").`,
      });
    }
  }

  // compensation
  const cur = parseFloat(String(form.current_ctc_total ?? ""));
  const min = parseFloat(String(form.expected_ctc_min ?? ""));
  if (Number.isFinite(cur) && Number.isFinite(min) && cur > 0 && min < cur) {
    issues.push({
      severity: "warning", section: "compensation",
      message: "Your expected CTC is lower than your current CTC. Please confirm that is intended.",
    });
  }
  if (Number.isFinite(min) && (form.currency ?? "INR") === "INR" && facts.hasDates) {
    const years = facts.months / 12;
    if (min > 10 + years * 7) {
      issues.push({
        severity: "info", section: "compensation",
        message: `Your expected CTC is on the high side for about ${facts.text} of experience. Consider whether you want to keep it.`,
      });
    }
  }
  return issues;
}
