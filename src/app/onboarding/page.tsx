import Link from "next/link";
import { redirect } from "next/navigation";

import { createWebsiteAction } from "@/actions/website-actions";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
import { AppShell } from "@/components/dashboard/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const websites = await prisma.website.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AppShell
      title="Websites"
      description="Connect and verify your sites to capture subscribers and send campaigns."
      active="websites"
    >

      {!session.user.emailVerified ? (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Your email is not verified yet. Use the verification link printed in server logs.
        </p>
      ) : null}

      {searchParams.error ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {searchParams.error}
        </p>
      ) : null}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold">Add website</h2>
        <form className="mt-4 space-y-4" action={createWebsiteAction}>
          <div className="space-y-2">
            <Label htmlFor="name">Website name</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="domain">Domain URL</Label>
            <Input id="domain" name="domain" type="url" placeholder="https://example.com" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="logo">Logo URL (optional)</Label>
            <Input id="logo" name="logo" type="url" placeholder="https://example.com/logo.png" />
          </div>
          <Button type="submit">Create website</Button>
        </form>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold">Your websites</h2>
        <ul className="mt-4 space-y-3">
          {websites.length ? (
            websites.map((site) => (
              <li key={site.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                <div>
                  <p className="font-medium text-slate-900">{site.name}</p>
                  <p className="text-sm text-slate-600">{site.domain}</p>
                </div>
                <Button asChild variant="secondary">
                  <Link href={`/websites/${site.id}`}>Manage</Link>
                </Button>
              </li>
            ))
          ) : (
            <li className="text-sm text-slate-600">No websites yet.</li>
          )}
        </ul>
      </div>
    </AppShell>
  );
}
