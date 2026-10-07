import { adminAct, adminCandidate, type AdminAction } from "@/lib/admin";
import { errorResponse, HttpError, requireAdmin } from "@/lib/auth";
import { findUser } from "@/lib/users";

export const maxDuration = 60;
const ACTIONS: AdminAction[] = ["reopen", "mark_submitted", "clear_chat", "reset_profile", "regenerate_thankyou"];

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    if (!findUser(id)) throw new HttpError(404, "Not found");
    return Response.json(await adminCandidate(id));
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    if (!findUser(id)) throw new HttpError(404, "Not found");
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? "") as AdminAction;
    if (!ACTIONS.includes(action)) throw new HttpError(400, "Unknown action");
    const message = await adminAct(id, action);
    return Response.json({ ok: true, message });
  } catch (e) {
    return errorResponse(e);
  }
}
