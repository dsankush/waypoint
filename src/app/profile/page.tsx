import { redirect } from "next/navigation";

export const metadata = { title: "Your profile" };
import { getSessionUser } from "@/lib/auth";
import { FormShell } from "@/components/form/FormShell";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getSessionUser().catch(() => null);
  if (!user) redirect("/");
  if (user.role === "admin") redirect("/admin");
  return <FormShell user={{ id: user.id, name: user.name }} />;
}
