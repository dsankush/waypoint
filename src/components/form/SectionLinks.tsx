"use client";

import { useRef, useState } from "react";
import { FileText, FileUp, GitBranch, Globe, Link2, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuickFill } from "./QuickFill";
import { SectionHeading, TextField } from "./fields";
import { useFormCtx } from "./form-context";

const MAX = 5 * 1024 * 1024;
const OK = ["pdf", "doc", "docx"];

function ResumeBox() {
  const { resume, setResume } = useFormCtx();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [size, setSize] = useState<number | null>(null);

  async function upload(file: File) {
    setError(""); setNote("");
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!OK.includes(ext)) return setError("Please upload a PDF, DOC or DOCX file.");
    if (file.size > MAX) return setError("That file is larger than 5 MB.");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { setError(j.error ?? "Upload failed. Please try again."); }
      else {
        setResume({ name: j.file_name, url: j.signed_url });
        setSize(file.size);
        if (j.readable === false) setNote("We couldn't read text from this file, but it has been saved.");
      }
    } catch {
      setError("Upload failed. Please try again.");
    }
    setBusy(false);
  }

  async function remove() {
    setBusy(true); setError(""); setNote("");
    const res = await fetch("/api/upload", { method: "DELETE" }).catch(() => null);
    if (res?.ok) { setResume(null); setSize(null); } else setError("Could not remove the file. Please try again.");
    setBusy(false);
  }

  return (
    <div className="space-y-2">
      <p className="text-[13px] font-medium">Resume <span className="font-normal text-muted-foreground">(optional)</span></p>
      {resume ? (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
          <FileText className="size-5 text-primary" strokeWidth={1.75} />
          <div className="min-w-0 flex-1">
            {resume.url ? (
              <a href={resume.url} target="_blank" rel="noreferrer" className="block truncate text-sm font-medium underline-offset-2 hover:underline">{resume.name}</a>
            ) : (
              <span className="block truncate text-sm font-medium">{resume.name}</span>
            )}
            {size !== null && <span className="text-xs text-muted-foreground">{(size / 1024).toFixed(0)} KB</span>}
          </div>
          <Button variant="outline" size="sm" onClick={() => input.current?.click()} disabled={busy}>Replace</Button>
          <Button variant="ghost" size="sm" onClick={remove} disabled={busy}><Trash2 /> Remove</Button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) upload(f); }}
          className={`flex flex-col items-center gap-2 rounded-lg border border-dashed p-6 text-center transition-colors ${drag ? "border-primary bg-primary/5" : "border-input bg-card"}`}
        >
          {busy ? <Loader2 className="size-6 animate-spin text-primary" /> : <FileUp className="size-6 text-muted-foreground" strokeWidth={1.75} />}
          <p className="text-sm">{busy ? "Uploading…" : "Drag a file here, or"}</p>
          {!busy && <Button variant="outline" onClick={() => input.current?.click()}>Choose a file</Button>}
          <p className="text-xs text-muted-foreground">PDF, DOC or DOCX, up to 5 MB</p>
        </div>
      )}
      <input
        ref={input} type="file" className="sr-only" aria-label="Upload resume"
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }}
      />
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {note && <p className="text-sm text-muted-foreground">{note}</p>}
    </div>
  );
}

export function SectionLinks() {
  return (
    <div>
      <SectionHeading title="Links & resume" description="Where recruiters can learn more about you." />
      <QuickFill section="links" />
      <div className="grid gap-7">
        <div className="flex items-start gap-3">
          <Link2 className="mt-8 size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
          <TextField className="flex-1" name="linkedin_url" label="LinkedIn profile" required type="url" inputMode="url" placeholder="https://www.linkedin.com/in/your-name" />
        </div>
        <div className="flex items-start gap-3">
          <GitBranch className="mt-8 size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
          <TextField className="flex-1" name="github_url" label="GitHub (optional)" type="url" inputMode="url" placeholder="https://github.com/your-name" />
        </div>
        <div className="flex items-start gap-3">
          <Globe className="mt-8 size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
          <TextField className="flex-1" name="portfolio_url" label="Portfolio or website (optional)" type="url" inputMode="url" placeholder="https://" />
        </div>
        <ResumeBox />
      </div>
    </div>
  );
}
