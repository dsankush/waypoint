import { errorResponse, requireUser } from "@/lib/auth";
import { generateThankYou, readThankYou } from "@/lib/thankyou";

export const maxDuration = 60;

export async function GET() {
  try {
    const u = await requireUser();
    let r = await readThankYou(u.id);
    if (r.notSubmitted) return Response.json({ error: "Profile not submitted yet" }, { status: 409 });
    if (r.missing) {
      await generateThankYou(u.id);
      r = await readThankYou(u.id);
      if (r.notSubmitted || r.missing) return Response.json({ error: "Not available" }, { status: 409 });
    }
    return Response.json({ character: r.character, content: r.content, submittedAt: r.submittedAt });
  } catch (e) {
    return errorResponse(e);
  }
}
