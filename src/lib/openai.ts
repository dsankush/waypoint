import "server-only";
import OpenAI from "openai";

let c: OpenAI | null = null;
export function ai() {
  if (!c) {
    if (!process.env.OPENAI_API_KEY) throw new Error("Assistant is not configured");
    c = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return c;
}
export const MODEL = () => process.env.OPENAI_MODEL || "gpt-4o";
export const FAST_MODEL = () => process.env.OPENAI_FAST_MODEL || MODEL();
