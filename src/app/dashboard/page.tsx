import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Users,
  Globe,
  Megaphone,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Plus,
  ArrowRight,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { AppShell } from "@/components/dashboard/app-shell";

export const dynamic = "force-dynamic";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  DRAFT: {
    label: "Draft",
    color: "bg-slate-100 text-slate-600",
    icon: <FileText className="h-3.5 w-3.5" />,
  },
  SCHEDULED: {
    label: "Scheduled",
    color: "bg-blue-100 text-blue-700",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  QUEUED: {
    label: "Queued",
    color: "bg-amber-100 text-amber-700",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  SENDING: {
    label: "Sending",
    color: "bg-blue-100 text-blue-700",
    icon: <Send className="h-3.5 w-3.5" />,
  },
  SENT: {
    label: "Sent",
    color: "bg-emerald-100 text-emerald-700",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  FAILED: {
    label: "Failed",
    color: "bg-red-100 text-red-700",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { campaign?: string };
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { prisma } = await import("@/lib/prisma");

  const [websites, campaigns, totalSubscribers] = await Promise.all([
    prisma.website.findMany({
      where: { userId: session.user.id },
      include: { _count: { select: { subscribers: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.campaign.findMany({
      where: { website: { userId: session.user.id } },
      include: {
        stats: true,
        website: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.subscriber.count({
      where: { website: { userId: session.user.id } },
    }),
  ]);

  const totalSent = campaigns.reduce((sum, c) => sum + (c.stats?.sentCount ?? 0), 0);
  const totalDelivered = campaigns.reduce(
    (sum, c) => sum + (c.stats?.deliveredCount ?? 0),
    0,
  );
  const totalClicked = campaigns.reduce(
    (sum, c) => sum + (c.stats?.clickedCount ?? 0),
    0,
  );

  return (
    <AppShell
      title="Dashboard"
      description="Track performance, monitor campaign output, and launch new broadcasts."
      active="dashboard"
      actions={
        <Link
          href="/campaigns/new"
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" />
          New Campaign
        </Link>
      }
    >
      {/* Banner */}
      {searchParams.campaign === "created" ? (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Campaign created and queued for sending!
        </div>
      ) : searchParams.campaign === "draft" ? (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
          <FileText className="h-4 w-4 shrink-0" />
          Campaign saved as draft.
        </div>
      ) : null}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Globe className="h-5 w-5 text-slate-600" />}
          label="Websites"
          value={websites.length}
        />
        <StatCard
          icon={<Users className="h-5 w-5 text-indigo-600" />}
          label="Total Subscribers"
          value={totalSubscribers}
          color="bg-indigo-50"
        />
        <StatCard
          icon={<Megaphone className="h-5 w-5 text-amber-600" />}
          label="Campaigns"
          value={campaigns.length}
          color="bg-amber-50"
        />
        <StatCard
          icon={<Send className="h-5 w-5 text-emerald-600" />}
          label="Notifications Sent"
          value={totalSent}
          color="bg-emerald-50"
        />
      </div>

      {/* Delivery stats row */}
      {totalSent > 0 ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <MiniStat label="Delivered" value={totalDelivered} total={totalSent} />
          <MiniStat label="Clicked" value={totalClicked} total={totalSent} />
          <MiniStat
            label="Failed"
            value={campaigns.reduce((sum, c) => sum + (c.stats?.failedCount ?? 0), 0)}
            total={totalSent}
            warn
          />
        </div>
      ) : null}

      {/* Websites summary */}
      {websites.length > 0 ? (
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-800">Your websites</h2>
            <Link
              href="/onboarding"
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900"
            >
              Manage <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {websites.map((w) => (
              <Link
                key={w.id}
                href={`/websites/${w.id}`}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{w.name}</p>
                  <p className="truncate text-xs text-slate-500">{w.domain}</p>
                </div>
                <div className="ml-3 shrink-0 text-right">
                  <p className="text-sm font-semibold text-slate-700">
                    {w._count.subscribers}
                  </p>
                  <p className="text-[11px] text-slate-400">subscribers</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <Globe className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-3 font-medium text-slate-600">No websites yet</p>
          <p className="mt-1 text-sm text-slate-500">
            Add a website to start collecting subscribers.
          </p>
          <Link
            href="/onboarding"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            Add Website
          </Link>
        </div>
      )}

      {/* Campaigns list */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">Recent campaigns</h2>
          <Link
            href="/campaigns/new"
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900"
          >
            New <Plus className="h-3.5 w-3.5" />
          </Link>
        </div>

        {campaigns.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <Megaphone className="mx-auto h-8 w-8 text-slate-400" />
            <p className="mt-3 font-medium text-slate-600">No campaigns yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Create your first campaign to broadcast to your subscribers.
            </p>
            <Link
              href="/campaigns/new"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              Create Campaign
            </Link>
          </div>
        ) : (
          <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Campaign</th>
                  <th className="hidden px-4 py-3 sm:table-cell">Website</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="hidden px-4 py-3 text-right sm:table-cell">Sent</th>
                  <th className="hidden px-4 py-3 text-right lg:table-cell">Delivered</th>
                  <th className="hidden px-4 py-3 text-right lg:table-cell">Clicked</th>
                  <th className="hidden px-4 py-3 text-right md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaigns.map((campaign) => {
                  const s = STATUS_CONFIG[campaign.status] ?? STATUS_CONFIG.DRAFT;
                  return (
                    <tr
                      key={campaign.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="max-w-[200px] px-4 py-3">
                        <p className="truncate font-medium text-slate-900">
                          {campaign.title}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {campaign.message}
                        </p>
                      </td>
                      <td className="hidden px-4 py-3 text-slate-600 sm:table-cell">
                        {campaign.website.name}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${s.color}`}
                        >
                          {s.icon}
                          {s.label}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 text-right tabular-nums text-slate-600 sm:table-cell">
                        {campaign.stats?.sentCount ?? 0}
                      </td>
                      <td className="hidden px-4 py-3 text-right tabular-nums text-slate-600 lg:table-cell">
                        {campaign.stats?.deliveredCount ?? 0}
                      </td>
                      <td className="hidden px-4 py-3 text-right tabular-nums text-slate-600 lg:table-cell">
                        {campaign.stats?.clickedCount ?? 0}
                      </td>
                      <td className="hidden px-4 py-3 text-right text-xs text-slate-400 md:table-cell">
                        {new Date(campaign.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function StatCard({
  icon,
  label,
  value,
  color = "bg-slate-50",
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className={`inline-flex rounded-xl p-2.5 ${color}`}>{icon}</div>
      <p className="mt-3 text-2xl font-bold text-slate-900">{value.toLocaleString()}</p>
      <p className="mt-0.5 text-sm text-slate-500">{label}</p>
    </div>
  );
}

function MiniStat({
  label,
  value,
  total,
  warn = false,
}: {
  label: string;
  value: number;
  total: number;
  warn?: boolean;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">{label}</p>
        <p className={`text-sm font-semibold ${warn && pct > 10 ? "text-red-600" : "text-slate-800"}`}>
          {pct}%
        </p>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${warn && pct > 10 ? "bg-red-400" : "bg-emerald-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-slate-400">{value.toLocaleString()} of {total.toLocaleString()}</p>
    </div>
  );
}
