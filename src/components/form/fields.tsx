"use client";

import { useId, useState } from "react";
import {
  Briefcase, Check, ChevronsUpDown, GraduationCap, Link2, ListChecks, Target, User, Wallet, Wrench, X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useFormCtx } from "./form-context";

const control =
  "w-full rounded-xl border border-input bg-card px-4 text-[15px] outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive";

/** Wrapper: label, hint, inline error, highlight when a helper just filled it. */
export function Field({
  name, label, required, hint, className, children, error: errorOverride, id,
}: {
  name?: string; label: string; required?: boolean; hint?: string; className?: string;
  children: (a: { id: string; invalid: boolean; describedBy?: string }) => React.ReactNode;
  error?: string; id?: string;
}) {
  const ctx = useFormCtx();
  const auto = useId();
  const fid = id ?? auto;
  const err = errorOverride ?? (name ? ctx.errors[name] : undefined);
  const show = !!err && (ctx.showAllErrors || (name ? ctx.touched.has(name) : false));
  const hl = name ? ctx.highlight.has(name) : false;
  return (
    <div
      className={cn(
        "space-y-2.5 rounded-2xl transition-[background-color,box-shadow] duration-500",
        hl && "bg-primary/10 ring-4 ring-primary/10",
        className,
      )}
    >
      <Label htmlFor={fid} className="text-[13.5px] font-semibold text-foreground/75">
        {label}
        {required && <span className="ml-0.5 text-destructive" aria-hidden>*</span>}
        {required && <span className="sr-only"> (required)</span>}
      </Label>
      {children({ id: fid, invalid: show, describedBy: show ? `${fid}-err` : hint ? `${fid}-hint` : undefined })}
      {hint && !show && <p id={`${fid}-hint`} className="text-xs text-muted-foreground">{hint}</p>}
      {show && <p id={`${fid}-err`} role="alert" className="text-xs text-destructive">{err}</p>}
    </div>
  );
}

export function TextField({
  name, label, required, hint, type = "text", placeholder, suffix, inputMode, className, onFocusFill,
}: {
  name: string; label: string; required?: boolean; hint?: string; type?: string;
  placeholder?: string; suffix?: string; inputMode?: "decimal" | "numeric" | "tel" | "email" | "url";
  className?: string; onFocusFill?: string;
}) {
  const { form, set, touch } = useFormCtx();
  const value = String((form as Record<string, unknown>)[name] ?? "");
  return (
    <Field name={name} label={label} required={required} hint={hint} className={className}>
      {({ id, invalid, describedBy }) => (
        <div className="relative">
          <Input
            id={id}
            type={type}
            inputMode={inputMode}
            value={value}
            placeholder={placeholder}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            onChange={(e) => set({ [name]: e.target.value } as never)}
            onFocus={() => { if (onFocusFill && !value) set({ [name]: onFocusFill } as never); }}
            onBlur={() => touch(name)}
            className={cn("h-12 rounded-xl bg-card px-4 text-[15px]", suffix && "pr-16")}
          />
          {suffix && (
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
              {suffix}
            </span>
          )}
        </div>
      )}
    </Field>
  );
}

export function AreaField({
  name, label, hint, placeholder, rows = 3, required,
}: { name: string; label: string; hint?: string; placeholder?: string; rows?: number; required?: boolean }) {
  const { form, set, touch } = useFormCtx();
  return (
    <Field name={name} label={label} hint={hint} required={required}>
      {({ id, invalid, describedBy }) => (
        <Textarea
          id={id}
          rows={rows}
          value={String((form as Record<string, unknown>)[name] ?? "")}
          placeholder={placeholder}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          onChange={(e) => set({ [name]: e.target.value } as never)}
          onBlur={() => touch(name)}
          className="rounded-xl bg-card px-4 py-3 text-[15px]"
        />
      )}
    </Field>
  );
}

export function SelectBox({
  id, value, onChange, options, placeholder = "Select…", invalid, describedBy, onBlur, disabled,
}: {
  id?: string; value: string; onChange: (v: string) => void; options: string[];
  placeholder?: string; invalid?: boolean; describedBy?: string; onBlur?: () => void; disabled?: boolean;
}) {
  const list = value && !options.includes(value) ? [value, ...options] : options;
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        disabled={disabled}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={cn(control, "h-12 appearance-none pr-10", !value && "text-muted-foreground")}
      >
        <option value="">{placeholder}</option>
        {list.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <ChevronsUpDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

export function SelectField({
  name, label, options, required, hint, placeholder, className,
}: {
  name: string; label: string; options: string[]; required?: boolean; hint?: string;
  placeholder?: string; className?: string;
}) {
  const { form, set, touch } = useFormCtx();
  return (
    <Field name={name} label={label} required={required} hint={hint} className={className}>
      {({ id, invalid, describedBy }) => (
        <SelectBox
          id={id}
          value={String((form as Record<string, unknown>)[name] ?? "")}
          onChange={(v) => set({ [name]: v } as never)}
          onBlur={() => touch(name)}
          options={options}
          placeholder={placeholder}
          invalid={invalid}
          describedBy={describedBy}
        />
      )}
    </Field>
  );
}

export function RadioPills({
  name, label, options, required,
}: { name: string; label: string; options: string[]; required?: boolean }) {
  const { form, set, touch } = useFormCtx();
  const value = String((form as Record<string, unknown>)[name] ?? "");
  return (
    <Field name={name} label={label} required={required}>
      {({ id }) => (
        <div role="radiogroup" aria-labelledby={id} id={id} className="flex flex-wrap gap-2">
          {options.map((o) => (
            <button
              key={o}
              type="button"
              role="radio"
              aria-checked={value === o}
              onClick={() => { set({ [name]: value === o ? "" : o } as never); touch(name); }}
              className={cn(
                "h-12 min-w-16 flex-1 rounded-xl border px-5 text-[15px] font-medium transition active:scale-[.97] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                value === o
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-input bg-card hover:bg-muted",
              )}
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </Field>
  );
}

function Chips({ values, onRemove }: { values: string[]; onRemove: (v: string) => void }) {
  if (!values.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((v) => (
        <Badge key={v} variant="secondary" className="h-9 gap-1.5 rounded-full bg-accent pl-3.5 pr-2 text-sm font-medium text-accent-foreground">
          {v}
          <button
            type="button"
            aria-label={`Remove ${v}`}
            onClick={() => onRemove(v)}
            className="rounded-sm p-0.5 hover:bg-foreground/10"
          >
            <X className="size-3.5" />
          </button>
        </Badge>
      ))}
    </div>
  );
}

/** Free-entry chips: type and press Enter (or comma). */
export function ChipInput({
  name, label, required, hint, placeholder, suggestions = [],
}: {
  name: string; label: string; required?: boolean; hint?: string; placeholder?: string; suggestions?: string[];
}) {
  const { form, set, touch } = useFormCtx();
  const values = ((form as Record<string, unknown>)[name] as string[] | undefined) ?? [];
  const [text, setText] = useState("");
  const add = (raw: string) => {
    const v = raw.trim();
    if (!v) return;
    if (!values.some((x) => x.toLowerCase() === v.toLowerCase())) set({ [name]: [...values, v] } as never);
    setText("");
  };
  const sugg = suggestions.filter((s) => !values.some((x) => x.toLowerCase() === s.toLowerCase())).slice(0, 6);
  return (
    <Field name={name} label={label} required={required} hint={hint}>
      {({ id, invalid, describedBy }) => (
        <div className="space-y-3">
          <Input
            id={id}
            value={text}
            placeholder={placeholder ?? "Type and press Enter"}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            className="h-12 rounded-xl bg-card px-4 text-[15px]"
            onChange={(e) => {
              if (e.target.value.includes(",")) {
                e.target.value.split(",").forEach(add);
              } else setText(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); add(text); }
              if (e.key === "Backspace" && !text && values.length) set({ [name]: values.slice(0, -1) } as never);
            }}
            onBlur={() => { add(text); touch(name); }}
          />
          <Chips values={values} onRemove={(v) => set({ [name]: values.filter((x) => x !== v) } as never)} />
          {sugg.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <span>Suggestions:</span>
              {sugg.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => add(s)}
                  className="rounded-full border border-dashed border-input px-2.5 py-1 hover:bg-muted"
                >
                  + {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </Field>
  );
}

/** Searchable multi-select: a bottom sheet with search, like a native picker. */
export function MultiSelect({
  name, label, options, required, hint, placeholder = "Select…",
}: {
  name: string; label: string; options: string[]; required?: boolean; hint?: string; placeholder?: string;
}) {
  const { form, set, touch } = useFormCtx();
  const values = ((form as Record<string, unknown>)[name] as string[] | undefined) ?? [];
  const [open, setOpen] = useState(false);
  const toggle = (o: string) =>
    set({ [name]: values.includes(o) ? values.filter((x) => x !== o) : [...values, o] } as never);
  return (
    <Field name={name} label={label} required={required} hint={hint}>
      {({ id, invalid, describedBy }) => (
        <div className="space-y-2">
          <button
            type="button"
            id={id}
            onClick={() => setOpen(true)}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            aria-haspopup="dialog"
            className={cn(control, "flex h-12 items-center justify-between text-left", !values.length && "text-muted-foreground")}
          >
            <span className="truncate">{values.length ? `${values.length} selected` : placeholder}</span>
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
          </button>
          <Chips values={values} onRemove={toggle} />
          <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (!o) touch(name); }}>
            <SheetContent
              side="bottom"
              showCloseButton={false}
              className="mx-auto flex data-[side=bottom]:h-[80dvh] data-[side=bottom]:max-h-[80dvh] max-w-[440px] flex-col gap-0 overflow-hidden rounded-t-[28px] p-0"
            >
              <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-border" />
              <div className="flex items-center justify-between px-5 pb-2 pt-3">
                <SheetTitle className="font-serif text-xl">{label}</SheetTitle>
                <Button size="sm" className="h-9 rounded-full px-4" onClick={() => setOpen(false)}>Done</Button>
              </div>
              <Command className="min-h-0 flex-1 rounded-none bg-transparent px-2">
                <CommandInput placeholder="Search…" />
                <CommandList className="max-h-none min-h-0 flex-1 overflow-y-auto pb-6">
                  <CommandEmpty>No match.</CommandEmpty>
                  <CommandGroup>
                    {options.map((o) => (
                      <CommandItem key={o} value={o} onSelect={() => toggle(o)} className="min-h-12 rounded-xl px-3 text-base">
                        <span className={cn("flex size-5 items-center justify-center rounded-md border", values.includes(o) ? "border-primary bg-primary text-primary-foreground" : "border-input")}>
                          {values.includes(o) && <Check className="size-3.5" />}
                        </span>
                        {o}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </SheetContent>
          </Sheet>
        </div>
      )}
    </Field>
  );
}

export function CheckField({
  checked, onChange, label, id,
}: { checked: boolean; onChange: (v: boolean) => void; label: string; id?: string }) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <div className="flex items-center gap-2">
      <Checkbox id={fid} className="size-5 rounded-md" checked={checked} onCheckedChange={(v) => onChange(!!v)} />
      <Label htmlFor={fid} className="text-[15px] font-normal">{label}</Label>
    </div>
  );
}

/** Plain-input generic used inside repeatable entries (value/onChange, no form-name binding). */
export function BareInput({
  label, value, onChange, required, type = "text", placeholder, className, error, disabled, hint,
}: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean; type?: string;
  placeholder?: string; className?: string; error?: string; disabled?: boolean; hint?: string;
}) {
  return (
    <Field label={label} required={required} className={className} error={error} hint={hint}>
      {({ id, invalid, describedBy }) => (
        <Input
          id={id} type={type} value={value} placeholder={placeholder} disabled={disabled}
          aria-invalid={invalid} aria-describedby={describedBy}
          onChange={(e) => onChange(e.target.value)} className="h-12 rounded-xl bg-card px-4 text-[15px]"
        />
      )}
    </Field>
  );
}

export function BareSelect({
  label, value, onChange, options, required, className, error, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
  required?: boolean; className?: string; error?: string; placeholder?: string;
}) {
  return (
    <Field label={label} required={required} className={className} error={error}>
      {({ id, invalid, describedBy }) => (
        <SelectBox id={id} value={value} onChange={onChange} options={options}
          invalid={invalid} describedBy={describedBy} placeholder={placeholder} />
      )}
    </Field>
  );
}

export function BareArea({
  label, value, onChange, required, rows = 4, hint, placeholder, error,
}: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean;
  rows?: number; hint?: string; placeholder?: string; error?: string;
}) {
  return (
    <Field label={label} required={required} hint={hint} error={error}>
      {({ id, invalid, describedBy }) => (
        <Textarea id={id} rows={rows} value={value} placeholder={placeholder}
          aria-invalid={invalid} aria-describedby={describedBy}
          onChange={(e) => onChange(e.target.value)} className="bg-card" />
      )}
    </Field>
  );
}

const HEAD_ICON: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  "Personal details": User, Education: GraduationCap, Experience: Briefcase, Skills: Wrench,
  "Job preferences": Target, Compensation: Wallet, "Links & resume": Link2, "Review & submit": ListChecks,
};

export function SectionHeading({ title, description }: { title: string; description?: string }) {
  const Icon = HEAD_ICON[title];
  return (
    <div className="mb-8 flex items-start gap-4">
      {Icon && (
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-grad text-white shadow-sm">
          <Icon className="size-6" strokeWidth={1.75} />
        </span>
      )}
      <div className="min-w-0">
        <h2 className="font-serif text-[1.6rem] leading-tight tracking-tight">{title}</h2>
        {description && <p className="mt-1.5 text-[15px] leading-snug text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}

export { Check };
