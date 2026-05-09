import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getDashboardSummary } from "@/lib/analytics";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/dashboard/app-shell";
import { SentChart } from "@/components/dashboard/chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const summary = await getDashboardSummary(session.user.id);

  const campaigns = await prisma.campaign.findMany({
    where: {
      website: {
        userId: session.user.id,
      },
    },
    include: {
      website: true,
      stats: true,
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <AppShell
      title="Dashboard"
      description="Track performance, monitor campaign output, and launch new broadcasts."
      active="dashboard"
      actions={(
        <>
          <Button asChild variant="secondary">
            <Link href="/onboarding">Add website</Link>
          </Button>
          <Button asChild>
            <Link href="/campaigns/new">New campaign</Link>
          </Button>
        </>
      )}
    >
      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total subscribers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{summary.totalSubscribers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sent today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{summary.sentToday}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>CTR</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{summary.ctr}%</p>
          </CardContent>
        </Card>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-900">Last 7 days sends</h2>
        <div className="mt-4">
          <SentChart data={summary.chart} />
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-900">Campaigns</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600">
                <th className="py-2">Title</th>
                <th className="py-2">Website</th>
                <th className="py-2">Status</th>
                <th className="py-2">Sent</th>
                <th className="py-2">Delivered</th>
                <th className="py-2">Clicked</th>
                <th className="py-2">Failed</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="border-b border-slate-100">
                  <td className="py-2 font-medium text-slate-900">{campaign.title}</td>
                  <td className="py-2 text-slate-600">{campaign.website.name}</td>
                  <td className="py-2 text-slate-600">{campaign.status}</td>
                  <td className="py-2">{campaign.stats?.sentCount || 0}</td>
                  <td className="py-2">{campaign.stats?.deliveredCount || 0}</td>
                  <td className="py-2">{campaign.stats?.clickedCount || 0}</td>
                  <td className="py-2">{campaign.stats?.failedCount || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
