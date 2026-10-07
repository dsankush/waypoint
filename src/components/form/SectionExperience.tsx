"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EMPLOYMENT_TYPE, INDUSTRY, WORK_MODE } from "@/lib/options";
import type { ExperienceEntry } from "@/lib/schema";
import { EntryCard, moveItem } from "./EntryCard";
import { BareArea, BareInput, BareSelect, CheckField, Field, SectionHeading } from "./fields";
import { useFormCtx } from "./form-context";
import { QuickFill } from "./QuickFill";
import { Input } from "@/components/ui/input";

type Entry = Partial<ExperienceEntry>;

function SkillChips({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const items = value.split(",").map((s) => s.trim()).filter(Boolean);
  const [text, setText] = useState("");
  const add = (raw: string) => {
    const v = raw.trim();
    if (!v || items.some((x) => x.toLowerCase() === v.toLowerCase())) { setText(""); return; }
    onChange([...items, v].join(", "));
    setText("");
  };
  return (
    <Field label="Skills used" className="lg:col-span-2" hint="Type a skill and press Enter.">
      {({ id, describedBy }) => (
        <div className="space-y-2">
          <Input
            id={id} value={text} aria-describedby={describedBy} className="h-12 rounded-xl bg-card px-3.5 text-base"
            onChange={(e) => (e.target.value.includes(",") ? e.target.value.split(",").forEach(add) : setText(e.target.value))}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(text); } }}
            onBlur={() => add(text)}
          />
          {items.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {items.map((s) => (
                <Badge key={s} variant="secondary" className="h-6 gap-1 rounded-md pr-1 text-xs font-normal">
                  {s}
                  <button type="button" aria-label={`Remove ${s}`} className="rounded-sm p-0.5 hover:bg-foreground/10"
                    onClick={() => onChange(items.filter((x) => x !== s).join(", "))}>
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

export function SectionExperience() {
  const { form, set, errors } = useFormCtx();
  const list = form.experience ?? [];
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const k = (i: number) => String((list[i] as { _k?: string })?._k ?? i);
  const none = !!form.no_experience;

  const update = (i: number, patch: Entry) =>
    set({ experience: list.map((e, j) => (j === i ? { ...e, ...patch } : e)) });
  const add = () =>
    set({ experience: [{ is_current: false, _k: crypto.randomUUID() } as Entry, ...list], no_experience: false });

  return (
    <div>
      <SectionHeading title="Experience" description="Your work history, newest first. Freshers can skip this step." />
      <QuickFill section="experience" />
      <div className="mb-4">
        <CheckField
          checked={none}
          onChange={(v) => set({ no_experience: v })}
          label="I have no work experience yet"
        />
      </div>
      {!none && (
        <div className="space-y-5">
          {list.length === 0 && (
            <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No experience added yet.
            </p>
          )}
          {list.map((e, i) => {
            const err = (f: string) => errors[`experience.${i}.${f}`];
            const hasErr = Object.keys(errors).some((x) => x.startsWith(`experience.${i}.`));
            return (
              <EntryCard
                key={k(i)}
                title={`Experience ${i + 1}${e.company || e.job_title ? ": " + [e.company, e.job_title].filter(Boolean).join(", ") : ""}`}
                collapsed={!!collapsed[k(i)]}
                onToggle={() => setCollapsed((c) => ({ ...c, [k(i)]: !c[k(i)] }))}
                onUp={i > 0 ? () => set({ experience: moveItem(list, i, i - 1) }) : undefined}
                onDown={i < list.length - 1 ? () => set({ experience: moveItem(list, i, i + 1) }) : undefined}
                onDuplicate={() => set({ experience: [...list.slice(0, i + 1), { ...e, _k: crypto.randomUUID() } as Entry, ...list.slice(i + 1)] })}
                onDelete={() => set({ experience: list.filter((_, j) => j !== i) })}
                hasError={hasErr}
              >
                <BareInput label="Company" required value={e.company ?? ""} onChange={(v) => update(i, { company: v })} error={err("company")} />
                <BareInput label="Job title" required value={e.job_title ?? ""} onChange={(v) => update(i, { job_title: v })} error={err("job_title")} />
                <BareSelect label="Employment type" required value={e.employment_type ?? ""} onChange={(v) => update(i, { employment_type: v })} options={EMPLOYMENT_TYPE} error={err("employment_type")} />
                <BareSelect label="Industry" value={e.industry ?? ""} onChange={(v) => update(i, { industry: v })} options={INDUSTRY} />
                <BareInput label="Location" value={e.location ?? ""} onChange={(v) => update(i, { location: v })} />
                <BareSelect label="Work mode" value={e.work_mode ?? ""} onChange={(v) => update(i, { work_mode: v as Entry["work_mode"] })} options={WORK_MODE} />
                <div className="grid grid-cols-2 gap-4">
                  <BareInput label="Start" required type="month" placeholder="YYYY-MM" value={e.start_date ?? ""} onChange={(v) => update(i, { start_date: v })} error={err("start_date")} />
                  <BareInput label="End" type="month" placeholder="YYYY-MM" value={e.is_current ? "" : e.end_date ?? ""} disabled={!!e.is_current} onChange={(v) => update(i, { end_date: v })} />
                </div>
                <CheckField
                  checked={!!e.is_current}
                  onChange={(v) => update(i, { is_current: v, end_date: v ? "" : e.end_date })}
                  label="I currently work here"
                />
                <div className="grid grid-cols-2 gap-4 lg:col-span-2"><BareInput label="Reporting to" value={e.reporting_to ?? ""} onChange={(v) => update(i, { reporting_to: v })} />
                <BareInput label="Team size" value={e.team_size ?? ""} onChange={(v) => update(i, { team_size: v })} /></div>
                <div className="lg:col-span-2">
                  <BareArea
                    label="Responsibilities" required rows={5}
                    hint={`${(e.responsibilities ?? "").length} characters. Describe what you did in this role.`}
                    value={e.responsibilities ?? ""} onChange={(v) => update(i, { responsibilities: v })}
                    error={err("responsibilities")}
                  />
                </div>
                <div className="lg:col-span-2">
                  <BareArea label="Achievements" rows={3} value={e.achievements ?? ""} onChange={(v) => update(i, { achievements: v })} />
                </div>
                <SkillChips value={e.skills_used ?? ""} onChange={(v) => update(i, { skills_used: v })} />
                <BareInput label="CTC at this role" type="text" value={e.ctc_at_role ?? ""} onChange={(v) => update(i, { ctc_at_role: v.replace(/[^\d.]/g, "") })} hint="In the currency you chose on the Compensation step." />
                <BareInput label="Reason for leaving" value={e.reason_for_leaving ?? ""} onChange={(v) => update(i, { reason_for_leaving: v })} />
              </EntryCard>
            );
          })}
          <Button variant="outline" onClick={add}><Plus /> Add another experience</Button>
        </div>
      )}
    </div>
  );
}
