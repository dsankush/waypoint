"use client";

/** Ends the session. Never throws; returns false if the server could not be reached. */
export async function requestSignOut(): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/logout", { method: "POST" });
    return res.ok;
  } catch {
    return false;
  }
}

export function clearWelcomeFlags() {
  try {
    Object.keys(sessionStorage).filter((k) => k.startsWith("cp-welcome-")).forEach((k) => sessionStorage.removeItem(k));
  } catch { /* ignore */ }
}
