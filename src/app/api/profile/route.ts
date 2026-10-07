import { after } from "next/server";
import { errorResponse, requireUser } from "@/lib/auth";
import { countChat, loadForm, saveForm } from "@/lib/db";
import { sanitizeForm } from "@/lib/sanitize";
import { sectionOfError, validateFull } from "@/lib/schema";
import { updateSummary } from "@/lib/summary";
import { ensureGuide, generateThankYou } from "@/lib/thankyou";

export const maxDuration = 60;

export async function GET() {
  try {
    const u = await requireUser();
    const { form, status, updatedAt, resume } = await loadForm(u.id);
    return Response.json({ data: form, status, updatedAt, resume });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function PUT(req: Request) {
  try {
    const u = await requireUser();
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }
    const submit = body.submit === true;
    const form = sanitizeForm(body.data);

    if (submit) {
      const errors = validateFull(form);
      if (Object.keys(errors).length) {
        const sections = [...new Set(Object.keys(errors).map(sectionOfError))];
        return Response.json({ error: "Some required details are missing.", errors, sections }, { status: 422 });
      }
    }

    const savedAt = await saveForm(u.id, form, submit);

    if (!submit) {
      // keep the guide in step with the profile; it only changes when something meaningful did
      after(async () => {
        try { await ensureGuide(u.id, { minGapMs: 90_000, capMs: 25_000 }); } catch { /* best effort */ }
      });
    }

    if (submit) {
      await generateThankYou(u.id); // never throws; falls back to a built-in note
      after(async () => {
        try {
          if ((await countChat(u.id)) > 0) await updateSummary(u.id);
        } catch { /* best effort */ }
      });
    }
    return Response.json({ ok: true, savedAt, status: submit ? "submitted" : "draft" });
  } catch (e) {
    return errorResponse(e);
  }
}
