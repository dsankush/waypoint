import { adminExport } from "@/lib/admin";
import { errorResponse, requireAdmin } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { csv, json } = await adminExport();
    const fmt = new URL(req.url).searchParams.get("format") === "json" ? "json" : "csv";
    const body = fmt === "json" ? JSON.stringify(json, null, 2) : csv;
    return new Response(body, {
      headers: {
        "Content-Type": fmt === "json" ? "application/json" : "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="candidates.${fmt}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
