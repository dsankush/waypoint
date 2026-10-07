import { redirect } from "next/navigation";

export const metadata = { title: "All set" };
import { getSessionUser } from "@/lib/auth";
import { ThankYou } from "@/components/done/ThankYou";

export const dynamic = "force-dynamic";

export default async function DonePage() {
  const user = await getSessionUser().catch(() => null);
  if (!user) redirect("/");
  if (user.role === "admin") redirect("/admin");
  return <ThankYou />;
}
