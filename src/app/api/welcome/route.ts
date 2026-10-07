import { errorResponse, requireUser } from "@/lib/auth";
import { loginStreak } from "@/lib/db";
import { readWelcome } from "@/lib/thankyou";

export const maxDuration = 60;

export async function GET() {
  try {
    const u = await requireUser();
    const [welcome, streak] = await Promise.all([readWelcome(u.id), loginStreak(u.id)]);
    return Response.json({ ...welcome, streak: streak.streak, days: streak.totalDays });
  } catch (e) {
    return errorResponse(e);
  }
}
