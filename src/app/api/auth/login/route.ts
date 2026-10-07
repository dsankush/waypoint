import { cookies } from "next/headers";
import { checkPassword, errorResponse } from "@/lib/auth";
import { failedLogins, logLogin } from "@/lib/db";
import { COOKIE_NAME, cookieOptions, signSession } from "@/lib/session";
import { findAccount } from "@/lib/users";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_FAILS = 5;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const user = findAccount(String(body?.user ?? ""));
    const password = String(body?.password ?? "");
    if (!user || !password || password.length > 200) {
      await new Promise((r) => setTimeout(r, 400));
      return Response.json({ error: "Incorrect password" }, { status: 401 });
    }
    if ((await failedLogins(user.id, WINDOW_MS)) >= MAX_FAILS) {
      return Response.json(
        { error: "Too many attempts. Please wait a few minutes and try again." },
        { status: 429 },
      );
    }
    if (!checkPassword(user.id, password)) {
      await logLogin(user.id, false);
      await new Promise((r) => setTimeout(r, 400));
      return Response.json({ error: "Incorrect password" }, { status: 401 });
    }
    await logLogin(user.id, true);
    const store = await cookies();
    store.set(COOKIE_NAME, await signSession(user.id), cookieOptions);
    return Response.json({ ok: true, role: user.role });
  } catch (e) {
    return errorResponse(e);
  }
}
