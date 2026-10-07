"use client";

import { CURRENCY, CURRENCY_LABEL } from "@/lib/options";
import { QuickFill } from "./QuickFill";
import { Field, RadioPills, SectionHeading, SelectField, TextField } from "./fields";
import { useFormCtx } from "./form-context";
import { Input } from "@/components/ui/input";

const n = (v: unknown) => {
  const x = parseFloat(String(v ?? ""));
  return Number.isFinite(x) ? x : 0;
};
const fmt = (x: number) => String(Math.round(x * 100) / 100);

export function SectionCompensation() {
  const { form, set, touch } = useFormCtx();
  const unit = CURRENCY_LABEL[form.currency ?? "INR"] ?? "";

  // Total follows fixed + variable until the person types their own total.
  function setPart(name: "current_ctc_fixed" | "current_ctc_variable", v: string) {
    const fixed = name === "current_ctc_fixed" ? v : form.current_ctc_fixed ?? "";
    const variable = name === "current_ctc_variable" ? v : form.current_ctc_variable ?? "";
    const prevSum = n(form.current_ctc_fixed) + n(form.current_ctc_variable);
    const total = form.current_ctc_total ?? "";
    const follow = total === "" || n(total) === prevSum;
    set({
      [name]: v,
      ...(follow ? { current_ctc_total: fixed || variable ? fmt(n(fixed) + n(variable)) : "" } : {}),
    } as never);
  }

  const part = (name: "current_ctc_fixed" | "current_ctc_variable", label: string) => (
    <Field name={name} label={label}>
      {({ id }) => (
        <div className="relative">
          <Input
            id={id} inputMode="decimal" value={String(form[name] ?? "")} className="h-12 rounded-xl bg-card px-3.5 pr-3 text-base"
            onChange={(e) => setPart(name, e.target.value.replace(/[^\d.]/g, ""))}
            onBlur={() => touch(name)}
          />
          
        </div>
      )}
    </Field>
  );

  return (
    <div>
      <SectionHeading title="Compensation" description={`Amounts are in ${form.currency ?? "INR"}${(form.currency ?? "INR") === "INR" ? " as LPA (lakhs per annum)" : " per year"}.`} />
      <QuickFill section="compensation" />
      <div className="grid gap-x-6 gap-y-7 lg:grid-cols-2">
        <SelectField name="currency" label="Currency" options={CURRENCY} />
        <div className="grid grid-cols-2 gap-4">
          {part("current_ctc_fixed", "Current: fixed")}
          {part("current_ctc_variable", "Current: variable")}
        </div>
        <TextField name="current_ctc_total" label="Current CTC: total" required inputMode="decimal" suffix={unit} />
        <div className="grid grid-cols-2 gap-4">
          <TextField name="expected_ctc_min" label="Expected: min" required inputMode="decimal" />
          <TextField name="expected_ctc_max" label="Expected: max" inputMode="decimal" />
        </div>
        <div className="lg:col-span-2">
          <RadioPills name="ctc_negotiable" label="Is your expectation negotiable?" options={["Yes", "No"]} />
        </div>
      </div>
    </div>
  );
}
