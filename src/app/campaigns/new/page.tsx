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
      title="Send notification"
      description="Create a message to prompt users to take action."
      active="campaigns"
    >

      {searchParams.error ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {searchParams.error}
        </p>
      ) : null}

      <form className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]" action={createCampaignAction}>
        <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">New notification</h2>
            <p className="mt-1 text-sm text-slate-600">Design content, destination URL, and delivery mode.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="campaignName">Campaign name</Label>
              <Input id="campaignName" name="campaignName" placeholder="Campaign Name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="websiteId">Select website</Label>
              <Select
                id="websiteId"
                name="websiteId"
                required
                options={websites.map((site) => ({ label: `${site.name} (${site.domain})`, value: site.id }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required placeholder="Title" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="message">Message</Label>
              <span className="mono text-xs text-slate-500">Max 250 characters</span>
            </div>
            <textarea
              id="message"
              name="message"
              required
              maxLength={250}
              rows={4}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
              placeholder="Write a short message to drive action"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="clickUrl">URL</Label>
              <Input id="clickUrl" name="clickUrl" type="url" required placeholder="https://example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="iconUrl">Custom icon</Label>
              <Input id="iconUrl" name="iconUrl" type="url" placeholder="https://example.com/icon.png" />
            </div>
          </div>

          <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
              Include UTM params
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
              Add large image (Chrome 56+)
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
              Auto-hide notification (Chrome)
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
              Action buttons
            </label>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Advanced targeting</h3>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="browser">Browser</Label>
                <Input id="browser" name="browser" placeholder="Chrome" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location / Timezone</Label>
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
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-900">When to post</h3>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="scheduleAt">Schedule for (optional)</Label>
                <Input id="scheduleAt" name="scheduleAt" type="datetime-local" />
              </div>
              <label className="mt-7 flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" name="saveAsDraft" value="1" className="h-4 w-4 rounded border-slate-300" />
                Save as draft
              </label>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="submit">Send notification</Button>
            <Button type="submit" variant="secondary" name="saveAsDraft" value="1">
              Save draft
            </Button>
          </div>
        </section>

        <aside className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-2xl font-semibold text-slate-900">Preview</h2>

          <div className="space-y-4 text-sm">
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="font-semibold text-slate-800">Chrome</p>
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="font-medium">Title</p>
                <p className="mt-1 text-xs text-slate-500">Website notification preview</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <p className="font-semibold text-slate-800">Chrome on Windows</p>
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="font-medium">Title</p>
                <p className="mt-1 text-xs text-slate-500">Google Chrome • domain.com</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <p className="font-semibold text-slate-800">Chrome on MacOS</p>
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="font-medium">Title</p>
                <p className="mt-1 text-xs text-slate-500">Google Chrome • domain.com</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <p className="font-semibold text-slate-800">Chrome on Android</p>
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="font-medium">Title</p>
                <p className="mt-1 text-xs text-slate-500">Google Chrome • domain.com</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="font-semibold text-slate-800">Firefox</p>
                <p className="mt-2 text-xs text-slate-500">Title</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="font-semibold text-slate-800">Apple iOS</p>
                <p className="mt-2 text-xs text-slate-500">Title</p>
              </div>
            </div>
          </div>
        </aside>
      </form>
    </AppShell>
  );
}
