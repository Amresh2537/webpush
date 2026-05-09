import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/dashboard/app-shell";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <AppShell
      title="Dashboard"
      description="Track performance, monitor campaign output, and launch new broadcasts."
      active="dashboard"
    >
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <p className="text-slate-600">Dashboard</p>
      </div>
    </AppShell>
  );
}
