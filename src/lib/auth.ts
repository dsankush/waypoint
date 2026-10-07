import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession } from "./session";
import { findAccount } from "./users";

export function checkPassword(userId: string, supplied: string): boolean {
  const expected = process.env[`PASSWORD_${userId.toUpperCase()}`];
  if (!expected) return false;
  // hash both so lengths always match for timingSafeEqual
  const a = createHash("sha256").update(supplied).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

/** Returns the signed-in account (candidate or admin), or null. The id always comes from the signed cookie. */
export async function getSessionUser() {
  const store = await cookies();
  const id = await verifySession(store.get(COOKIE_NAME)?.value);
  if (!id) return null;
  return findAccount(id) ?? null;
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Candidate-only routes: admins have no profile and are turned away. */
export async function requireUser() {
  const u = await getSessionUser();
  if (!u) throw new HttpError(401, "Not signed in");
  if (u.role !== "candidate") throw new HttpError(403, "Not available for this account");
  return u;
}

export async function requireAdmin() {
  const u = await getSessionUser();
  if (!u) throw new HttpError(401, "Not signed in");
  if (u.role !== "admin") throw new HttpError(403, "Admins only");
  return u;
}

export function errorResponse(e: unknown) {
  if (e instanceof HttpError) {
    return Response.json({ error: e.message }, { status: e.status });
  }
  console.error("route error:", e instanceof Error ? e.message : "unknown");
  return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}
