import { errorResponse, HttpError, requireUser } from "@/lib/auth";
import { addNote } from "@/lib/db";
import { SECTIONS, type Section } from "@/lib/schema";

export async function PUT(req: Request) {
  try {
    const u = await requireUser();
    const body = await req.json().catch(() => ({}));
    const section = String(body?.section ?? "") as Section;
    const text = String(body?.text ?? "").trim().slice(0, 4000);
    if (!SECTIONS.includes(section) || !text) throw new HttpError(400, "Invalid request");
    await addNote(u.id, section, text);
    return Response.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
