"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Loader2, Mic, MicOff, NotebookPen } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { applyEntries, applyFields, type FillResult } from "@/lib/merge";
import type { Section } from "@/lib/schema";
import { FillPreview, type ApplyPayload } from "./FillPreview";
import { useFormCtx } from "./form-context";

const PLACEHOLDERS: Record<Section, string> = {
  personal: "e.g. I'm Ayushi, based in Pune, my number is +91 98xxxxxx, I can join in 30 days and I'm happy to relocate.",
  education: "e.g. B.Tech in Computer Science from XYZ University, 2016 to 2020, 8.2 CGPA. 12th CBSE 2016, 92 percent.",
  experience: "Paste the work-history section of your resume, or write e.g. I spent 3 years at ABC as a backend developer building billing APIs…",
  skills: "e.g. Python, SQL, Airflow, a bit of Go. Hindi native, English fluent. AWS Cloud Practitioner.",
  preferences: "e.g. I want backend or data engineering roles, remote or hybrid in Pune or Bengaluru.",
  compensation: "e.g. I earn 14 lakh fixed and 2 lakh variable. I'm hoping for 22 to 26 lakh, a little flexible.",
  links: "Paste any text that contains your profile links, such as a resume header or a bio.",
  review: "Anything else a recruiter should know about you?",
};

const GUIDANCE =
  "Tell us in your own words, or paste from your resume. We will fill in this step for you.";
const MAX = 4000;

type SR = {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null; onerror: (() => void) | null;
  start: () => void; stop: () => void;
};

export function QuickFill({ section }: { section: Section }) {
  const { form, set, flash, userId } = useFormCtx();
  const storeKey = `qf-used-${userId}-${section}`;
  const [open, setOpen] = useState(true);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<FillResult | null>(null);
  const [runId, setRunId] = useState(0);
  const [canDictate, setCanDictate] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef<SR | null>(null);

  useEffect(() => {
    try { if (localStorage.getItem(storeKey)) setOpen(false); } catch { /* ignore */ }
    const w = window as unknown as Record<string, unknown>;
    setCanDictate(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
    return () => recRef.current?.stop();
  }, [storeKey]);

  function toggleDictation() {
    if (listening) { recRef.current?.stop(); return; }
    const w = window as unknown as Record<string, new () => SR>;
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = "en-IN"; rec.continuous = true; rec.interimResults = false;
    rec.onresult = (e) => {
      const chunk = Array.from(e.results).map((r) => r[0].transcript).join(" ");
      setText((t) => (t ? t + " " : "") + chunk.trim());
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  }

  async function run() {
    if (!text.trim() || busy) return;
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, mode: "fill", text, form, previous: result?.proposal }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(j.error ?? "Something went wrong. Please try again.");
      } else {
        setResult(j as FillResult);
        setRunId((n) => n + 1);
      }
    } catch {
      setError("Could not reach the server. Please try again.");
    }
    setBusy(false);
  }

  function finish(summary: string) {
    fetch("/api/notes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section, text }),
    }).catch(() => {});
    try { localStorage.setItem(storeKey, "1"); } catch { /* ignore */ }
    toast.success(summary);
    setResult(null); setText(""); setOpen(false);
  }

  function apply(p: ApplyPayload) {
    if (!result) return;
    if (p.kind === "fields" && "fields" in result.proposal) {
      const r = applyFields(form, result.proposal.fields, { replace: p.replace, selected: p.selected });
      if (!r.changed.length) {
        toast.message("Nothing new to add. Those fields already have values.");
        return;
      }
      set(r.form);
      flash(r.changed);
      finish(`Filled ${r.changed.length} ${r.changed.length === 1 ? "field" : "fields"}`);
    } else if (p.kind === "entries" && "entries" in result.proposal && (section === "education" || section === "experience")) {
      const r = applyEntries(form, section, result.proposal.entries, p.mode, p.selected);
      set(r.form);
      flash([section]);
      finish(p.mode === "replace" ? "Entries replaced" : r.added ? `Added ${r.added} ${r.added === 1 ? "entry" : "entries"}` : "Those entries were already listed");
    }
  }

  return (
    <section className="mb-9 overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-accent via-white to-white shadow-sm" aria-label="Quick fill">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-4 px-6 py-5 text-left"
      >
        <span className="flex size-9 items-center justify-center rounded-full bg-grad text-white"><NotebookPen className="size-[18px]" strokeWidth={1.75} /></span>
        <span className="flex-1"><span className="block font-serif text-lg leading-tight">Quick fill</span><span className="block text-xs text-muted-foreground">Write it your way, we do the typing</span></span>
        <ChevronDown className={`ml-auto size-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-6 pb-6">
          <p className="mb-4 text-sm text-muted-foreground">{GUIDANCE}</p>
          <Textarea
            value={text}
            maxLength={MAX}
            rows={5}
            onChange={(e) => setText(e.target.value)}
            placeholder={PLACEHOLDERS[section]}
            aria-label="Quick fill text"
            className="rounded-2xl bg-card px-4 py-4 text-base"
          />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button onClick={run} disabled={busy || !text.trim()} className="cta h-10 px-5 text-sm">
              {busy && <Loader2 className="animate-spin" />}
              {busy ? "Reading…" : "Fill this step"}
            </Button>
            <Button
              variant="outline" className="h-10 rounded-full px-4 text-sm"
              disabled={busy || (!text && !result)}
              onClick={() => { setText(""); setResult(null); setError(""); }}
            >
              Clear
            </Button>
            {canDictate && (
              <Button variant="outline" onClick={toggleDictation} className="size-10 rounded-full" aria-label={listening ? "Stop dictation" : "Dictate"}>
                {listening ? <MicOff /> : <Mic />}
              </Button>
            )}
            <span className="ml-auto text-xs tabular-nums text-muted-foreground">{text.length}/{MAX}</span>
          </div>
          {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
          {result && (
            <FillPreview
              key={runId}
              section={section}
              result={result}
              form={form}
              onApply={apply}
              onDiscard={() => setResult(null)}
              onUseSuggestion={(v) => { set({ total_experience: v }); flash(["total_experience"]); toast.success("Total experience updated"); }}
            />
          )}
        </div>
      )}
    </section>
  );
}
