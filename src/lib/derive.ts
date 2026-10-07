import type { FormState } from "./schema";

export function ymIndex(s?: string | null): number | null {
  const m = /^(\d{4})-(\d{2})/.exec(String(s ?? ""));
  if (!m) return null;
  const mo = Number(m[2]);
  if (mo < 1 || mo > 12) return null;
  return Number(m[1]) * 12 + (mo - 1);
}

export function nowIndex(d = new Date()) {
  return d.getFullYear() * 12 + d.getMonth();
}

export function idxToLabel(i: number) {
  const y = Math.floor(i / 12);
  const m = (i % 12) + 1;
  return `${y}-${String(m).padStart(2, "0")}`;
}

export function fmtMonths(m: number) {
  if (m <= 0) return "0m";
  const y = Math.floor(m / 12);
  const r = m % 12;
  return [y ? `${y}y` : "", r ? `${r}m` : ""].filter(Boolean).join(" ");
}

export function bucketForMonths(m: number): string {
  if (m <= 0) return "Fresher";
  if (m < 12) return "Less than 1 year";
  if (m < 24) return "1-2 years";
  if (m < 36) return "2-3 years";
  if (m < 60) return "3-5 years";
  if (m < 96) return "5-8 years";
  if (m < 144) return "8-12 years";
  if (m < 180) return "12-15 years";
  return "15+ years";
}

export type Interval = { n: number; start: number; end: number; label: string };

export function intervalsOf(exp: FormState["experience"]): Interval[] {
  const now = nowIndex();
  const out: Interval[] = [];
  (exp ?? []).forEach((e, i) => {
    const s = ymIndex(e.start_date);
    if (s === null) return;
    const end = e.is_current ? now : ymIndex(e.end_date);
    if (end === null) return;
    out.push({
      n: i + 1, start: s, end,
      label: [e.job_title, e.company].filter(Boolean).join(" at ") || `Experience ${i + 1}`,
    });
  });
  return out;
}

export function deriveFacts(form: Pick<FormState, "experience">) {
  const iv = intervalsOf(form.experience).filter((x) => x.end >= x.start);
  const sorted = [...iv].sort((a, b) => a.start - b.start);
  const merged: { start: number; end: number }[] = [];
  for (const x of sorted) {
    const last = merged[merged.length - 1];
    if (last && x.start <= last.end) last.end = Math.max(last.end, x.end);
    else merged.push({ start: x.start, end: x.end });
  }
  const months = merged.reduce((t, m) => t + (m.end - m.start), 0);
  const gaps: { from: number; to: number; months: number }[] = [];
  for (let i = 1; i < merged.length; i++) {
    const g = merged[i].start - merged[i - 1].end;
    if (g > 0) gaps.push({ from: merged[i - 1].end, to: merged[i].start, months: g });
  }
  const overlaps: [Interval, Interval][] = [];
  for (let i = 0; i < sorted.length; i++)
    for (let j = i + 1; j < sorted.length; j++)
      if (sorted[j].start < sorted[i].end && sorted[j].start > sorted[i].start) {
        overlaps.push([sorted[i], sorted[j]]);
      }
  const cur = (form.experience ?? []).find((e) => e.is_current);
  return {
    months,
    text: fmtMonths(months),
    bucket: bucketForMonths(months),
    hasDates: iv.length > 0,
    gaps,
    overlaps,
    currentRole: cur ? [cur.job_title, cur.company].filter(Boolean).join(", ") : "",
  };
}
