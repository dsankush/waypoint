"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deriveFacts } from "@/lib/derive";
import { LANGUAGES, PROFICIENCY, TOTAL_EXPERIENCE } from "@/lib/options";
import { QuickFill } from "./QuickFill";
import { AreaField, ChipInput, Field, SectionHeading, SelectBox, SelectField } from "./fields";
import { useFormCtx } from "./form-context";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

function Languages() {
  const { form, set } = useFormCtx();
  const values = form.languages ?? [];
  const [lang, setLang] = useState("");
  const [prof, setProf] = useState("Fluent");
  const add = () => {
    if (!lang) return;
    const entry = `${lang} (${prof})`;
    const rest = values.filter((v) => !v.toLowerCase().startsWith(lang.toLowerCase() + " ("));
    set({ languages: [...rest, entry] });
    setLang("");
  };
  return (
    <Field label="Languages" className="lg:col-span-2" hint="Choose a language and how well you know it.">
      {({ id }) => (
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_9rem_auto] gap-2">
            <SelectBox id={id} value={lang} onChange={setLang} options={LANGUAGES} placeholder="Language" />
            <SelectBox value={prof} onChange={setProf} options={PROFICIENCY} />
            <Button variant="outline" onClick={add} disabled={!lang} className="h-12 rounded-xl"><Plus /> Add</Button>
          </div>
          {values.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {values.map((v) => (
                <Badge key={v} variant="secondary" className="h-6 gap-1 rounded-md pr-1 text-xs font-normal">
                  {v}
                  <button type="button" aria-label={`Remove ${v}`} className="rounded-sm p-0.5 hover:bg-foreground/10"
                    onClick={() => set({ languages: values.filter((x) => x !== v) })}>
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </Field>
  );
}

export function SectionSkills() {
  const { form, set, flash } = useFormCtx();
  const facts = deriveFacts({ experience: form.no_experience ? [] : form.experience ?? [] });
  const suggest = facts.hasDates && facts.bucket !== form.total_experience ? facts.bucket : null;
  return (
    <div>
      <SectionHeading title="Skills" description="What you are good at, the languages you speak and any certifications." />
      <QuickFill section="skills" />
      <div className="grid gap-x-6 gap-y-7 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <ChipInput name="skills" label="Skills" required placeholder="e.g. Python, then press Enter" />
        </div>
        <Languages />
        <div className="lg:col-span-2"><AreaField name="certifications" label="Certifications" hint="One per line or separated by commas." /></div>
        <div className="space-y-2">
          <SelectField name="total_experience" label="Total experience" options={TOTAL_EXPERIENCE} required />
          {suggest && (
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>Your experience dates add up to about {facts.text} ({suggest}).</span>
              <Button size="sm" variant="outline" onClick={() => { set({ total_experience: suggest }); flash(["total_experience"]); }}>
                Use {suggest}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
