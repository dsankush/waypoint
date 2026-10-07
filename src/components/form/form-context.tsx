"use client";

import { createContext, useContext } from "react";
import type { FieldErrors, FormState, Section } from "@/lib/schema";

export type FormCtx = {
  form: FormState;
  /** shallow-merge top-level fields */
  set: (patch: Partial<FormState>) => void;
  errors: FieldErrors;
  /** show every error (after an attempted continue / submit) */
  showAllErrors: boolean;
  touched: Set<string>;
  touch: (name: string) => void;
  highlight: Set<string>;
  goTo: (s: Section) => void;
  /** briefly highlight fields that were just filled for the person */
  flash: (names: string[]) => void;
  userId: string;
  resume: { name: string; url: string | null } | null;
  setResume: (r: { name: string; url: string | null } | null) => void;
};

export const Ctx = createContext<FormCtx | null>(null);

export function useFormCtx() {
  const c = useContext(Ctx);
  if (!c) throw new Error("FormCtx missing");
  return c;
}
