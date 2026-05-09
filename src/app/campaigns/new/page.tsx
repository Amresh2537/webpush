import { redirect } from "next/navigation";

import { createCampaignAction } from "@/actions/campaign-actions";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/dashboard/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export default async function NewCampaignPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const websites = await prisma.website.findMany({
    where: {
      userId: session.user.id,
      isVerified: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AppShell
      title="Create campaign"
      description="Compose notification content, segment audience, and schedule delivery."
      active="campaigns"
    >

      {searchParams.error ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {searchParams.error}
        </p>
      ) : null}

      <form className="mt-6 space-y-5 rounded-2xl border border-slate-200 bg-white p-6" action={createCampaignAction}>
        <div className="space-y-2">
          <Label htmlFor="websiteId">Website</Label>
          <Select
            id="websiteId"
            name="websiteId"
            required
            options={websites.map((site) => ({ label: `${site.name} (${site.domain})`, value: site.id }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Message</Label>
          <Input id="message" name="message" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="iconUrl">Icon URL</Label>
          <Input id="iconUrl" name="iconUrl" type="url" placeholder="https://example.com/icon.png" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="clickUrl">Click URL</Label>
          <Input id="clickUrl" name="clickUrl" type="url" required />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="browser">Segment by browser</Label>
            <Input id="browser" name="browser" placeholder="Chrome" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Segment by location</Label>
            <Input id="location" name="location" placeholder="Asia/Kolkata" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fromDate">From date</Label>
            <Input id="fromDate" name="fromDate" type="date" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="toDate">To date</Label>
            <Input id="toDate" name="toDate" type="date" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="scheduleAt">Schedule for (leave empty to send now)</Label>
          <Input id="scheduleAt" name="scheduleAt" type="datetime-local" />
        </div>

        <Button type="submit">Queue campaign</Button>
      </form>
    </AppShell>
  );
}
