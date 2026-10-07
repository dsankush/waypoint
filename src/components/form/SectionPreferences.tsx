"use client";

import {
  EMPLOYMENT_TYPE, INDUSTRY, LOCATIONS, PROFILES, TITLE_SUGGESTIONS, WORK_MODE,
} from "@/lib/options";
import { QuickFill } from "./QuickFill";
import { ChipInput, MultiSelect, SectionHeading } from "./fields";
import { useFormCtx } from "./form-context";

export function SectionPreferences() {
  const { form } = useFormCtx();
  const suggestions = (form.preferred_profiles ?? []).flatMap((p) => TITLE_SUGGESTIONS[p] ?? []);
  return (
    <div>
      <SectionHeading title="Job preferences" description="The kind of role you want next. The Career Advisor can help you with this too." />
      <QuickFill section="preferences" />
      <div className="grid gap-x-6 gap-y-7 lg:grid-cols-2">
        <div className="lg:col-span-2"><MultiSelect name="preferred_profiles" label="Preferred profiles" options={PROFILES} required /></div>
        <div className="lg:col-span-2">
          <ChipInput name="preferred_job_titles" label="Preferred job titles" required suggestions={suggestions} placeholder="e.g. Senior Backend Engineer" />
        </div>
        <MultiSelect name="preferred_industries" label="Preferred industries" options={INDUSTRY} />
        <MultiSelect name="preferred_work_mode" label="Preferred work mode" options={WORK_MODE} required />
        <MultiSelect name="preferred_locations" label="Preferred locations" options={LOCATIONS} />
        <MultiSelect name="employment_type_pref" label="Employment type" options={EMPLOYMENT_TYPE} />
      </div>
    </div>
  );
}
