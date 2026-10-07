import { redirect } from "next/navigation";

export const metadata = { title: "Admin" };
import { getSessionUser } from "@/lib/auth";
import { AdminApp } from "@/components/admin/AdminApp";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getSessionUser().catch(() => null);
  if (!user) redirect("/");
  if (user.role !== "admin") redirect("/profile");
  return <AdminApp />;
}
