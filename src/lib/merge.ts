import type { FormState, Section } from "./schema";
import { SECTION_FIELDS } from "./schema";

export type Unplaced = { text: string; reason: string };

export type FieldsProposal = { fields: Record<string, unknown> };
export type EntriesProposal = { entries: Record<string, unknown>[] };
export type Proposal = FieldsProposal | EntriesProposal;

export type FillResult = {
  proposal: Proposal;
  unplaced: Unplaced[];
  questions: string[];
  suggestions?: { total_experience?: string };
};

export function isEmptyValue(v: unknown) {
  if (v === undefined || v === null) return true;
  if (typeof v === "string") return v.trim() === "";
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

const norm = (v: unknown) => String(v ?? "").trim().toLowerCase().replace(/\s+/g, " ");

export function entryKey(section: "education" | "experience", e: Record<string, unknown>) {
  return section === "experience"
    ? [norm(e.company), norm(e.job_title), norm(e.start_date)].join("|")
    : [norm(e.degree), norm(e.institution), norm(e.end_year)].join("|");
}

export type ApplyOptions = {
  replace?: boolean;       // overwrite fields that already have a value
  selected?: string[];     // field names (single sections) to apply
};

/** Returns new form + names of changed fields. */
export function applyFields(
  form: FormState, fields: Record<string, unknown>, opts: ApplyOptions = {},
) {
  const next: Record<string, unknown> = { ...form };
  const changed: string[] = [];
  for (const [k, v] of Object.entries(fields)) {
    if (opts.selected && !opts.selected.includes(k)) continue;
    if (isEmptyValue(v)) continue;
    const cur = next[k];
    if (Array.isArray(v)) {
      const base = Array.isArray(cur) ? (cur as string[]) : [];
      const seen = new Set(base.map(norm));
      const add = (v as string[]).filter((x) => x && !seen.has(norm(x)));
      if (add.length) {
        next[k] = [...base, ...add];
        changed.push(k);
      }
    } else if (isEmptyValue(cur) || opts.replace) {
      if (norm(cur) !== norm(v)) {
        next[k] = v;
        changed.push(k);
      }
    }
  }
  return { form: next as FormState, changed };
}

function sortExperience(list: Record<string, unknown>[]) {
  return [...list].sort((a, b) => {
    if (a.is_current !== b.is_current) return a.is_current ? -1 : 1;
    return String(b.start_date ?? "").localeCompare(String(a.start_date ?? ""));
  });
}

export function applyEntries(
  form: FormState,
  section: "education" | "experience",
  entries: Record<string, unknown>[],
  mode: "add" | "replace",
  selectedIdx?: number[],
) {
  const picked = entries.filter((_, i) => !selectedIdx || selectedIdx.includes(i));
  const cleaned = picked.map((e) =>
    Object.fromEntries(Object.entries(e).filter(([, v]) => v !== null && v !== undefined)),
  );
  let list: Record<string, unknown>[];
  let added = 0;
  if (mode === "replace") {
    list = cleaned;
    added = cleaned.length;
  } else {
    list = [...((form[section] ?? []) as Record<string, unknown>[])];
    for (const e of cleaned) {
      const key = entryKey(section, e);
      const hit = list.findIndex((x) => entryKey(section, x) === key);
      if (hit >= 0) {
        // merge: fill blanks only
        const target = { ...list[hit] };
        for (const [k, v] of Object.entries(e)) if (isEmptyValue(target[k])) target[k] = v;
        list[hit] = target;
      } else {
        list.push(e);
        added++;
      }
    }
  }
  if (section === "experience") list = sortExperience(list);
  return { form: { ...form, [section]: list } as FormState, added };
}

/** Union two proposals so follow-up answers never lose earlier results. */
export function mergeProposals(prev: Proposal | undefined, next: Proposal): Proposal {
  if (!prev) return next;
  if ("fields" in prev && "fields" in next) {
    const out: Record<string, unknown> = { ...prev.fields };
    for (const [k, v] of Object.entries(next.fields)) {
      if (isEmptyValue(v)) continue;
      const old = out[k];
      out[k] = Array.isArray(v) && Array.isArray(old)
        ? [...old, ...(v as string[]).filter((x) => !old.map(norm).includes(norm(x)))]
        : v;
    }
    return { fields: out };
  }
  if ("entries" in prev && "entries" in next) {
    const out = [...prev.entries];
    for (const e of next.entries) {
      const sec = "company" in e || "job_title" in e ? "experience" : "education";
      const hit = out.findIndex((x) => entryKey(sec, x) === entryKey(sec, e));
      if (hit >= 0) {
        const t = { ...out[hit] };
        for (const [k, v] of Object.entries(e)) if (!isEmptyValue(v)) t[k] = v;
        out[hit] = t;
      } else out.push(e);
    }
    return { entries: out };
  }
  return next;
}

export function fieldsForSection(section: Section) {
  return SECTION_FIELDS[section];
}
