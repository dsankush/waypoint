import { errorResponse, HttpError, requireUser } from "@/lib/auth";
import { countRuns, logRun } from "@/lib/db";
import { runCheck, runFill } from "@/lib/assist";
import { sanitizeForm } from "@/lib/sanitize";
import { SECTIONS, type Section } from "@/lib/schema";
import type { Proposal } from "@/lib/merge";

export const maxDuration = 60;
const HOUR = 60 * 60 * 1000;

export async function POST(req: Request) {
  try {
    const u = await requireUser();
    const body = await req.json().catch(() => ({}));
    const section = String(body?.section ?? "") as Section;
    const mode = body?.mode === "check" ? "check" : "fill";
    const text = String(body?.text ?? "");
    if (!SECTIONS.includes(section)) throw new HttpError(400, "Invalid request");
    if (mode === "check" && section !== "review") throw new HttpError(400, "Invalid request");
    if (mode === "fill") {
      if (!text.trim()) throw new HttpError(400, "Please write something first.");
      if (text.length > 4000) throw new HttpError(400, "That is a little long. Please keep it under 4,000 characters.");
    }
    if ((await countRuns(u.id, ["fill", "check"], HOUR)) >= 30) {
      throw new HttpError(429, "You have used Quick fill a lot this hour. Please take a short break and try again later.");
    }
    await logRun(u.id, mode === "check" ? "check" : "fill", section, text.length);
    const form = sanitizeForm(body?.form);

    if (mode === "check") {
      const issues = await runCheck({ id: u.id, form });
      return Response.json({ issues });
    }

    let previous: Proposal | undefined;
    const p = body?.previous?.proposal ?? body?.previous;
    if (p && typeof p === "object" && ("fields" in p || "entries" in p)) previous = p as Proposal;
    const result = await runFill({ id: u.id, section, text, form, previous });
    return Response.json(result);
  } catch (e) {
    if (!(e instanceof HttpError)) console.error("assist failed");
    return errorResponse(e);
  }
}
