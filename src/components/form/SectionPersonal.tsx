"use client";

import { COUNTRIES, GENDER, NOTICE_PERIOD, STATES_IN, WORK_AUTH } from "@/lib/options";
import { QuickFill } from "./QuickFill";
import {
  AreaField, RadioPills, SectionHeading, SelectField, TextField,
} from "./fields";
import { useFormCtx } from "./form-context";

export function SectionPersonal() {
  const { form } = useFormCtx();
  return (
    <div>
      <SectionHeading title="Personal details" description="The basics a recruiter needs to reach you." />
      <QuickFill section="personal" />
      <div className="grid gap-x-6 gap-y-7 lg:grid-cols-2">
        <TextField name="full_name" label="Full name" required className="lg:col-span-2" />
        <TextField name="email" label="Email" type="email" inputMode="email" required />
        <TextField name="phone" label="Phone" type="tel" inputMode="tel" required placeholder="+91 98765 43210" onFocusFill="+91 " />
        <TextField name="alt_phone" label="Alternate phone" type="tel" inputMode="tel" />
        <TextField name="date_of_birth" label="Date of birth" type="date" />
        <SelectField name="gender" label="Gender" options={GENDER} />
        <TextField name="nationality" label="Nationality" />
        <TextField name="current_city" label="Current city" required />
        {(form.current_country ?? "") === "India" ? (
          <SelectField name="current_state" label="State" options={STATES_IN} />
        ) : (
          <TextField name="current_state" label="State / region" />
        )}
        <SelectField name="current_country" label="Country" options={COUNTRIES} required />
        <SelectField name="notice_period" label="Notice period" options={NOTICE_PERIOD} required />
        <SelectField name="work_authorization" label="Work authorization" options={WORK_AUTH} />
        <RadioPills name="willing_to_relocate" label="Willing to relocate" options={["Yes", "No", "Maybe"]} required />
        <div className="lg:col-span-2"><AreaField name="permanent_address" label="Permanent address" /></div>
      </div>
    </div>
  );
}
