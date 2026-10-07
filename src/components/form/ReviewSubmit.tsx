"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { deriveFacts } from "@/lib/derive";
import { label } from "@/lib/labels";
import {
  SECTION_FIELDS, SECTION_LABEL, sectionOfError, validateFull, type Section,
} from "@/lib/schema";
import { QuickFill } from "./QuickFill";
import { AreaField, SectionHeading } from "./fields";
import { useFormCtx } from "./form-context";
import { ProfileCheck } from "./ProfileCheck";

const SUMMARY_SECTIONS: Section[] = [
  "personal", "education", "experience", "skills", "preferences", "compensation", "links",
];

const show = (v: unknown) => (Array.isArray(v) ? v.join(", ") : String(v ?? ""));

export function ReviewSubmit({ flush }: { flush: () => Promise<boolean> }) {
  const { form, goTo, resume, errors } = useFormCtx();
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const facts = deriveFacts({ experience: form.experience ?? [] });
  const missing = Object.keys(errors);

  useEffect(() => {
    const h = () => (Object.keys(errors).length ? window.scrollTo?.(0, 0) : setConfirm(true));
    window.addEventListener("cp:submit", h);
    return () => window.removeEventListener("cp:submit", h);
  }, [errors]);

  async function submit() {
    setError("");
    const errs = validateFull(form);
    if (Object.keys(errs).length) {
      setConfirm(false);
      setError("Some required details are missing. Please complete the items listed below.");
      return;
    }
    setBusy(true);
    try {
      await flush(); // make sure the latest edits are stored first
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: form, submit: true }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) { router.push("/done"); return; }
      setError(j.error ?? "Could not submit. Please try again.");
    } catch {
      setError("Could not reach the server. Please try again.");
    }
    setConfirm(false);
    setBusy(false);
  }

  return (
    <div>
      <SectionHeading title="Review & submit" description="Take a last look. You can reopen and update your profile any time after submitting." />
      <QuickFill section="review" />
      <div className="mb-10"><AreaField name="additional_notes" label="Additional notes" hint="Anything else a recruiter should know." rows={4} /></div>

      <div className="space-y-6">
        {SUMMARY_SECTIONS.map((s) => (
          <section key={s} className="card-soft p-6">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-serif text-lg">{SECTION_LABEL[s]}</h3>
              <Button variant="link" size="sm" onClick={() => goTo(s)}>Edit</Button>
            </div>
            {s === "education" ? (
              (form.education ?? []).length ? (
                <ol className="space-y-1 text-sm">
                  {form.education.map((e, i) => (
                    <li key={i}>
                      <span className="font-medium">{[e.degree, e.field_of_study].filter(Boolean).join(", ") || e.level}</span>
                      <span className="text-muted-foreground"> · {[e.institution, [e.start_year, e.end_year].filter(Boolean).join("–"), e.status].filter(Boolean).join(" · ")}</span>
                    </li>
                  ))}
                </ol>
              ) : <p className="text-sm text-muted-foreground">Nothing added.</p>
            ) : s === "experience" ? (
              form.no_experience ? <p className="text-sm text-muted-foreground">No work experience yet.</p>
              : (form.experience ?? []).length ? (
                <ol className="space-y-1 text-sm">
                  {form.experience.map((e, i) => (
                    <li key={i}>
                      <span className="font-medium">{[e.job_title, e.company].filter(Boolean).join(" at ")}</span>
                      <span className="text-muted-foreground"> · {e.start_date || "?"} to {e.is_current ? "present" : e.end_date || "?"}</span>
                    </li>
                  ))}
                  {facts.hasDates && <li className="pt-1 text-xs text-muted-foreground">Dates add up to about {facts.text}.</li>}
                </ol>
              ) : <p className="text-sm text-muted-foreground">Nothing added.</p>
            ) : (
              <dl className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
                {SECTION_FIELDS[s].map((f) => {
                  const v = show((form as Record<string, unknown>)[f]);
                  return (
                    <div key={f} className="flex gap-2">
                      <dt className="w-40 shrink-0 text-muted-foreground">{label(f)}</dt>
                      <dd className="min-w-0 break-words">{v || <span className="text-muted-foreground">-</span>}</dd>
                    </div>
                  );
                })}
                {s === "links" && (
                  <div className="flex gap-2">
                    <dt className="w-40 shrink-0 text-muted-foreground">Resume</dt>
                    <dd>{resume?.name ?? <span className="text-muted-foreground">-</span>}</dd>
                  </div>
                )}
              </dl>
            )}
          </section>
        ))}
      </div>

      <div className="mt-10"><ProfileCheck /></div>

      {missing.length > 0 && (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <p className="font-medium">Still needed before you can submit</p>
          <ul className="mt-1 list-disc pl-5">
            {[...new Set(missing.map(sectionOfError))].map((s) => (
              <li key={s}>
                {SECTION_LABEL[s]}{" "}
                <Button variant="link" size="sm" className="h-auto p-0" onClick={() => goTo(s)}>Go to step</Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
      <div className="mt-6 flex justify-end">
        <button type="button" className="cta" onClick={() => setConfirm(true)} disabled={busy || missing.length > 0}>
          {busy && <Loader2 className="animate-spin" />} Submit profile
        </button>
      </div>

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Submit your profile?</DialogTitle>
            <DialogDescription>
              Your details will be saved and shared as submitted. You can reopen and edit them any time.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button type="button" className="cta-soft" onClick={() => setConfirm(false)} disabled={busy}>Keep editing</button>
            <button type="button" className="cta" onClick={submit} disabled={busy}>{busy && <Loader2 className="animate-spin" />} Submit</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
