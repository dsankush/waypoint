export const USERS = [
  { id: "ayushi", name: "Ayushi" },
  { id: "gaurav", name: "Gaurav" },
  { id: "pawan", name: "Pawan" },
] as const;

export const ADMIN = { id: "admin", name: "Admin" } as const;

export type UserId = (typeof USERS)[number]["id"];
export type Role = "candidate" | "admin";

/** Candidates only (these are the ones with a profile row). */
export function findUser(id: string) {
  return USERS.find((u) => u.id === id);
}

/** Anyone who can sign in. */
export function findAccount(id: string): { id: string; name: string; role: Role } | undefined {
  if (id === ADMIN.id) return { ...ADMIN, role: "admin" };
  const u = findUser(id);
  return u ? { id: u.id, name: u.name, role: "candidate" } : undefined;
}
