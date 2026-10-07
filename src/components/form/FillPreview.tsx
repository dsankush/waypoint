"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { isEmptyValue, type FillResult } from "@/lib/merge";
import { label } from "@/lib/labels";
import type { FormState, Section } from "@/lib/schema";

export type ApplyPayload =
  | { kind: "fields"; replace: boolean; selected?: string[] }
  | { kind: "entries"; mode: "add" | "replace"; selected: number[] };

const show = (v: unknown) => (Array.isArray(v) ? v.join(", ") : String(v ?? ""));

function entryTitle(section: Section, e: Record<string, unknown>) {
  if (section === "experience") {
    const when = `${e.start_date ?? "?"} – ${e.is_current ? "present" : e.end_date ?? "?"}`;
    return {
      title: [e.job_title, e.company].filter(Boolean).join(" at "),
      sub: [when, e.location, e.work_mode, e.employment_type].filter(Boolean).join(" · "),
      body: String(e.responsibilities ?? ""),
    };
  }
  return {
    title: [e.degree, e.field_of_study].filter(Boolean).join(", ") || String(e.level ?? ""),
    sub: [e.institution, [e.start_year, e.end_year].filter(Boolean).join("–"), e.status,
      e.grade ? `${e.grade} ${e.grade_type ?? ""}` : ""].filter(Boolean).join(" · "),
    body: "",
  };
}

export function FillPreview({
  section, result, form, onApply, onDiscard, onUseSuggestion,
}: {
  section: Section;
  result: FillResult;
  form: FormState;
  onApply: (p: ApplyPayload) => void;
  onDiscard: () => void;
  onUseSuggestion: (v: string) => void;
}) {
  const isEntries = "entries" in result.proposal;
  const fields = useMemo(
    () => ("fields" in result.proposal ? Object.entries(result.proposal.fields) : []),
    [result],
  );
  const entries = "entries" in result.proposal ? result.proposal.entries : [];

  const [selFields, setSelFields] = useState<Set<string>>(() => new Set(fields.map(([k]) => k)));
  const [selEntries, setSelEntries] = useState<Set<number>>(() => new Set(entries.map((_, i) => i)));
  const [replace, setReplace] = useState(false);
  const [confirmReplace, setConfirmReplace] = useState(false);

  const toggleField = (k: string) =>
    setSelFields((s) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });
  const toggleEntry = (i: number) =>
    setSelEntries((s) => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n; });

  const nothing = isEntries ? entries.length === 0 : fields.length === 0;

  return (
    <div className="mt-6 rounded-3xl border border-border bg-card p-6" aria-live="polite">
      <h3 className="font-serif text-lg">Here is what we picked up</h3>

      {nothing && (
        <p className="mt-2 text-sm text-muted-foreground">
          Nothing could be filled in from that text. You can add a little more detail and try again.
        </p>
      )}

      {!isEntries && fields.length > 0 && (
        <ul className="mt-4 divide-y divide-border">
          {fields.map(([k, v]) => {
            const old = (form as Record<string, unknown>)[k];
            const hasOld = !isEmptyValue(old);
            const same = hasOld && show(old).toLowerCase() === show(v).toLowerCase();
            return (
              <li key={k} className="flex items-start gap-3 py-3.5">
                <Checkbox
                  id={`pf-${k}`}
                  checked={selFields.has(k)}
                  onCheckedChange={() => toggleField(k)}
                  className="mt-1"
                />
                <Label htmlFor={`pf-${k}`} className="block flex-1 cursor-pointer text-sm font-normal">
                  <span className="block text-xs text-muted-foreground">{label(k)}</span>
                  <span className="font-medium">{show(v)}</span>
                  {hasOld && !same && !Array.isArray(v) && (
                    <span className="ml-2 text-xs text-muted-foreground line-through">{show(old)}</span>
                  )}
                  {same && <span className="ml-2 text-xs text-muted-foreground">(already set)</span>}
                </Label>
              </li>
            );
          })}
        </ul>
      )}

      {isEntries && entries.length > 0 && (
        <ul className="mt-3 space-y-2">
          {entries.map((e, i) => {
            const t = entryTitle(section, e);
            return (
              <li key={i} className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4">
                <Checkbox
                  id={`pe-${i}`}
                  checked={selEntries.has(i)}
                  onCheckedChange={() => toggleEntry(i)}
                  className="mt-1"
                />
                <Label htmlFor={`pe-${i}`} className="block flex-1 cursor-pointer text-sm font-normal">
                  <span className="block font-medium">{t.title || "Entry"}</span>
                  <span className="block text-xs text-muted-foreground">{t.sub}</span>
                  {t.body && (
                    <span className="mt-1 block whitespace-pre-line text-xs text-foreground/80">{t.body}</span>
                  )}
                </Label>
              </li>
            );
          })}
        </ul>
      )}

      {result.suggestions?.total_experience && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md bg-secondary px-3 py-2 text-sm">
          <span>
            Based on your dates, your total experience looks like{" "}
            <strong>{result.suggestions.total_experience}</strong>.
          </span>
          <Button size="sm" variant="outline" onClick={() => onUseSuggestion(result.suggestions!.total_experience!)}>
            Use this
          </Button>
        </div>
      )}

      {result.unplaced.length > 0 && (
        <div className="mt-3 rounded-md border border-dashed border-border px-3 py-2 text-sm">
          <p className="font-medium">Could not place</p>
          <ul className="mt-1 list-disc pl-5 text-muted-foreground">
            {result.unplaced.map((u, i) => (
              <li key={i}>{u.text}{u.reason ? ` (${u.reason})` : ""}</li>
            ))}
          </ul>
        </div>
      )}

      {result.questions.length > 0 && (
        <div className="mt-3 rounded-md bg-secondary px-3 py-2 text-sm">
          <p className="font-medium">A few things would help</p>
          <ul className="mt-1 list-disc pl-5">
            {result.questions.map((q, i) => <li key={i}>{q}</li>)}
          </ul>
          <p className="mt-1 text-xs text-muted-foreground">
            Answer in the box above and press Fill again. What we found so far is kept.
          </p>
        </div>
      )}

      {!nothing && (
        <div className="mt-4 space-y-3">
          {!isEntries && (
            <div className="flex items-center gap-2">
              <Switch id="replace-sw" checked={replace} onCheckedChange={setReplace} />
              <Label htmlFor="replace-sw" className="text-sm font-normal">
                Also replace fields that already have a value
              </Label>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {!isEntries ? (
              <>
                <Button className="rounded-full" onClick={() => onApply({ kind: "fields", replace: false })}>
                  Apply to empty fields
                </Button>
                <Button
                  variant="outline"
                  disabled={selFields.size === 0}
                  onClick={() => onApply({ kind: "fields", replace, selected: [...selFields] })}
                >
                  Apply selected
                </Button>
              </>
            ) : confirmReplace ? (
              <>
                <Button
                  variant="destructive"
                  onClick={() => onApply({ kind: "entries", mode: "replace", selected: [...selEntries] })}
                >
                  Yes, replace all my entries
                </Button>
                <Button variant="outline" onClick={() => setConfirmReplace(false)}>Keep my entries</Button>
              </>
            ) : (
              <>
                <Button
                  disabled={selEntries.size === 0}
                  onClick={() => onApply({ kind: "entries", mode: "add", selected: [...selEntries] })}
                >
                  Add to my entries
                </Button>
                <Button
                  variant="outline"
                  disabled={selEntries.size === 0}
                  onClick={() => setConfirmReplace(true)}
                >
                  Replace all my entries
                </Button>
              </>
            )}
            <Button variant="ghost" onClick={onDiscard}>Discard</Button>
          </div>
          {isEntries && confirmReplace && (
            <p className="text-xs text-destructive">
              This removes everything currently listed in this step and uses only the selected entries above.
            </p>
          )}
        </div>
      )}
      {nothing && (
        <div className="mt-3"><Button variant="ghost" onClick={onDiscard}>Close</Button></div>
      )}
    </div>
  );
}
