import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { createCampaignAction } from "@/actions/campaign-actions";
import { AppShell } from "@/components/dashboard/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const dynamic = "force-dynamic";

export default async function NewCampaignPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

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

      <form className="mt-6 space-y-6" action={createCampaignAction}>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold">New notification</h2>
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Input id="message" name="message" required />
            </div>
            <Button type="submit">Send</Button>
          </div>
        </div>
      </form>
    </AppShell>
  );
}
