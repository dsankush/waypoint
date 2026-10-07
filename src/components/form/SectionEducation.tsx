"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEGREE, EDU_LEVEL, EDU_STATUS, GRADE_TYPE } from "@/lib/options";
import type { EducationEntry } from "@/lib/schema";
import { EntryCard, moveItem } from "./EntryCard";
import { BareInput, BareSelect, SectionHeading } from "./fields";
import { useFormCtx } from "./form-context";
import { QuickFill } from "./QuickFill";

type Entry = Partial<EducationEntry>;

export function SectionEducation() {
  const { form, set, errors } = useFormCtx();
  const list = form.education ?? [];
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const k = (i: number) => String((list[i] as { _k?: string })?._k ?? i);

  const update = (i: number, patch: Entry) =>
    set({ education: list.map((e, j) => (j === i ? { ...e, ...patch } : e)) });
  const add = () =>
    set({ education: [...list, { status: "Completed", _k: crypto.randomUUID() } as Entry] });

  return (
    <div>
      <SectionHeading title="Education" description="Add every qualification you want recruiters to see, newest first." />
      <QuickFill section="education" />
      <div className="space-y-5">
        {list.length === 0 && (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No education added yet.
          </p>
        )}
        {list.map((e, i) => {
          const err = (f: string) => errors[`education.${i}.${f}`];
          const hasErr = Object.keys(errors).some((x) => x.startsWith(`education.${i}.`));
          return (
            <EntryCard
              key={k(i)}
              title={`Education ${i + 1}${e.degree || e.institution ? ": " + [e.degree, e.institution].filter(Boolean).join(", ") : ""}`}
              collapsed={!!collapsed[k(i)]}
              onToggle={() => setCollapsed((c) => ({ ...c, [k(i)]: !c[k(i)] }))}
              onUp={i > 0 ? () => set({ education: moveItem(list, i, i - 1) }) : undefined}
              onDown={i < list.length - 1 ? () => set({ education: moveItem(list, i, i + 1) }) : undefined}
              onDuplicate={() => set({ education: [...list.slice(0, i + 1), { ...e, _k: crypto.randomUUID() } as Entry, ...list.slice(i + 1)] })}
              onDelete={() => set({ education: list.filter((_, j) => j !== i) })}
              hasError={hasErr}
            >
              <BareSelect label="Level" required value={e.level ?? ""} onChange={(v) => update(i, { level: v })} options={EDU_LEVEL} error={err("level")} />
              <BareSelect label="Degree" required value={e.degree ?? ""} onChange={(v) => update(i, { degree: v })} options={DEGREE} error={err("degree")} />
              <BareInput label="Field of study" value={e.field_of_study ?? ""} onChange={(v) => update(i, { field_of_study: v })} />
              <BareInput label="Institution" required value={e.institution ?? ""} onChange={(v) => update(i, { institution: v })} error={err("institution")} />
              <BareInput label="University / board" value={e.university_board ?? ""} onChange={(v) => update(i, { university_board: v })} />
              <BareInput label="Location" value={e.location ?? ""} onChange={(v) => update(i, { location: v })} />
              <div className="grid grid-cols-2 gap-4">
              <BareInput label="Start year" value={e.start_year ?? ""} onChange={(v) => update(i, { start_year: v.replace(/\D/g, "").slice(0, 4) })} placeholder="2016" />
              <BareInput label="End year" value={e.end_year ?? ""} onChange={(v) => update(i, { end_year: v.replace(/\D/g, "").slice(0, 4) })} placeholder="2020" />
              </div>
              <BareSelect label="Status" required value={e.status ?? ""} onChange={(v) => update(i, { status: v as Entry["status"] })} options={EDU_STATUS} error={err("status")} />
              <div className="grid grid-cols-2 gap-4 lg:col-span-2">
                <BareSelect label="Grade type" value={e.grade_type ?? ""} onChange={(v) => update(i, { grade_type: v as Entry["grade_type"] })} options={GRADE_TYPE} />
                <BareInput label="Grade" value={e.grade ?? ""} onChange={(v) => update(i, { grade: v })} />
              </div>
            </EntryCard>
          );
        })}
        <Button variant="outline" onClick={add}><Plus /> Add another education</Button>
      </div>
    </div>
  );
}
