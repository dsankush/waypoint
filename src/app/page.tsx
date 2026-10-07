import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { Landing } from "@/components/landing/Landing";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getSessionUser().catch(() => null);
  if (user) redirect(user.role === "admin" ? "/admin" : "/profile");
  return <Landing />;
}
