"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Info, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Issue } from "@/lib/checks";
import { SECTION_LABEL } from "@/lib/schema";
import { useFormCtx } from "./form-context";

const ICON = {
  error: <XCircle className="size-4 text-destructive" />,
  warning: <AlertTriangle className="size-4 text-[#B7791F]" />,
  info: <Info className="size-4 text-muted-foreground" />,
};

export function ProfileCheck() {
  const { form, goTo } = useFormCtx();
  const [busy, setBusy] = useState(false);
  const [issues, setIssues] = useState<Issue[] | null>(null);
  const [error, setError] = useState("");

  async function run() {
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "review", mode: "check", form }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) setError(j.error ?? "Something went wrong. Please try again.");
      else setIssues(j.issues as Issue[]);
    } catch {
      setError("Could not reach the server. Please try again.");
    }
    setBusy(false);
  }

  return (
    <div className="card-soft p-6">
      <div className="flex flex-col gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-lg">Check my profile</h3>
          <p className="text-sm text-muted-foreground">
            We read through everything and point out anything worth a second look. Nothing changes by itself.
          </p>
        </div>
        <button type="button" onClick={run} disabled={busy} className="cta-soft self-start">
          {busy && <Loader2 className="animate-spin" />}
          {busy ? "Checking…" : "Check my profile"}
        </button>
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
      {issues && (
        <div className="mt-4" aria-live="polite">
          {issues.length === 0 ? (
            <p className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 text-primary" /> Everything looks consistent.</p>
          ) : (
            <ul className="divide-y divide-border">
              {issues.map((it, i) => (
                <li key={i} className="flex items-start gap-3 py-2.5 text-sm">
                  <span className="mt-0.5">{ICON[it.severity]}</span>
                  <span className="flex-1">{it.message}</span>
                  <Button variant="link" size="sm" onClick={() => goTo(it.section)} className="shrink-0">
                    Go to {SECTION_LABEL[it.section]}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
