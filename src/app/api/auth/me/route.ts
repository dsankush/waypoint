import { errorResponse, getSessionUser, HttpError } from "@/lib/auth";

export async function GET() {
  try {
    const u = await getSessionUser();
    if (!u) throw new HttpError(401, "Not signed in");
    return Response.json({ id: u.id, name: u.name, role: u.role });
  } catch (e) {
    return errorResponse(e);
  }
}
