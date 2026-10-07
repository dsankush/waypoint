import { adminOverview } from "@/lib/admin";
import { errorResponse, requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
    return Response.json(await adminOverview());
  } catch (e) {
    return errorResponse(e);
  }
}
