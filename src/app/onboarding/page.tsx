import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Globe, CheckCircle, Clock, Users, Megaphone, ArrowRight } from "lucide-react";

import { auth } from "@/lib/auth";
import { createWebsiteAction } from "@/actions/website-actions";
import { AppShell } from "@/components/dashboard/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const dynamic = "force-dynamic";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: { error?: string; info?: string; deleted?: string };
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { prisma } = await import("@/lib/prisma");

  const websites = await prisma.website.findMany({
    where: { userId: session.user.id },
    include: {
      _count: { select: { subscribers: true, campaigns: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AppShell
      title="Websites"
      description="Connect and verify your sites to start collecting subscribers and sending campaigns."
      active="websites"
    >
      {searchParams.error ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {searchParams.error}
        </div>
      ) : null}

      {searchParams.info ? (
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          {searchParams.info}
        </div>
      ) : null}

      {searchParams.deleted ? (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          Website deleted successfully.
        </div>
      ) : null}

      {/* Existing websites */}
      {websites.length > 0 ? (
        <div className="mb-8">
          <h2 className="text-base font-semibold text-slate-700">Your websites</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {websites.map((w) => (
              <Link
                key={w.id}
                href={`/websites/${w.id}`}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                      <Globe className="h-5 w-5 text-slate-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{w.name}</p>
                      <p className="truncate text-xs text-slate-500">{w.domain}</p>
                    </div>
                  </div>
                  <span
                    className={`ml-2 flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                      w.isVerified
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {w.isVerified ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <Clock className="h-3 w-3" />
                    )}
                    {w.isVerified ? "Verified" : "Pending"}
                  </span>
                </div>

                <div className="mt-4 flex gap-5 text-sm text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    {w._count.subscribers}{" "}
                    {w._count.subscribers === 1 ? "subscriber" : "subscribers"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Megaphone className="h-4 w-4" />
                    {w._count.campaigns}{" "}
                    {w._count.campaigns === 1 ? "campaign" : "campaigns"}
                  </span>
                </div>

                <p className="mt-3 flex items-center gap-1 text-xs font-medium text-slate-400 transition group-hover:text-slate-700">
                  View details
                  <ArrowRight className="h-3.5 w-3.5" />
                </p>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {/* Add website */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900">
            <Plus className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Add website</h2>
            <p className="text-sm text-slate-500">
              Each website gets its own VAPID keys and subscriber list.
            </p>
          </div>
        </div>

        <form action={createWebsiteAction} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Website name</Label>
            <Input id="name" name="name" required placeholder="My Awesome Blog" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="domain">Domain (full URL)</Label>
            <Input
              id="domain"
              name="domain"
              type="url"
              required
              placeholder="https://mysite.com"
            />
            <p className="text-xs text-slate-500">
              Use the exact URL including https://, e.g. https://mysite.com
            </p>
          </div>
          <Button type="submit">
            <Plus className="mr-2 h-4 w-4" />
            Add Website
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
