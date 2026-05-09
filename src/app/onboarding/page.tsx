import { redirect } from "next/navigation";
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
  searchParams: { error?: string };
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <AppShell
      title="Websites"
      description="Connect and verify your sites to capture subscribers and send campaigns."
      active="websites"
    >
      {searchParams.error ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {searchParams.error}
        </p>
      ) : null}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold">Add website</h2>
        <form action={createWebsiteAction} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Website Name</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="domain">Domain</Label>
            <Input id="domain" name="domain" type="url" required />
          </div>
          <Button type="submit">Add Website</Button>
        </form>
      </div>
    </AppShell>
  );
}
