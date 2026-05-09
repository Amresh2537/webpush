import { notFound, redirect } from "next/navigation";

import { getAppUrl } from "@/lib/app-url";
import { getInstallSnippet } from "@/lib/sdk";
import { AppShell } from "@/components/dashboard/app-shell";
import { VerifyButton } from "@/components/websites/verify-button";

export const dynamic = "force-dynamic";

export default async function WebsiteDetailPage({
  params,
}: {
  params: { websiteId: string };
}) {
  const { auth } = await import("@/lib/auth");
  const { prisma } = await import("@/lib/prisma");
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const website = await prisma.website.findFirst({
    where: {
      id: params.websiteId,
      userId: session.user.id,
    },
  });

  if (!website) {
    notFound();
  }

  const snippet = getInstallSnippet(website);
  const appUrl = getAppUrl();
  const swDownloadUrl = `${appUrl}/sw.js`;

  return (
    <AppShell
      title={website.name}
      description={website.domain}
      active="websites"
    >

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold">Ownership verification</h2>
          <p className="mt-2 text-sm text-slate-600">
            Add either verification method and click verify.
          </p>

          <div className="mt-4 space-y-4 text-sm text-slate-700">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="font-medium">Meta tag</p>
              <pre className="mt-2 overflow-x-auto text-xs">
{`<meta name="notifyflow-verification" content="${website.ownershipToken}" />`}
              </pre>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="font-medium">DNS TXT record</p>
              <pre className="mt-2 overflow-x-auto text-xs">
{`notifyflow-verification=${website.ownershipToken}`}
              </pre>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <VerifyButton websiteId={website.id} method="META" />
            <VerifyButton websiteId={website.id} method="DNS" />
          </div>

          <p className="mt-4 text-sm">
            Status:{" "}
            <span className={website.isVerified ? "text-emerald-700" : "text-amber-700"}>
              {website.isVerified ? "Verified" : "Pending"}
            </span>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold">VAPID</h2>
          <p className="mt-3 text-sm text-slate-600">Public key</p>
          <pre className="mt-1 overflow-x-auto rounded-md bg-slate-50 p-3 text-xs">
{website.vapidPublicKey}
          </pre>
          <p className="mt-4 text-sm text-slate-600">Private key</p>
          <pre className="mt-1 overflow-x-auto rounded-md bg-slate-50 p-3 text-xs">
{website.vapidPrivateKey}
          </pre>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold">Install integration code</h2>
        <p className="mt-2 text-sm text-slate-600">
          Implement our integration code on your website to start gaining new subscribers.
        </p>

        <div className="mt-4 space-y-4 text-sm text-slate-700">
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="font-medium">Step 1: Upload service worker in website root (required)</p>
            <p className="mt-1">
              Upload <span className="font-mono text-xs">sw.js</span> into your website root folder (for example, public_html or html).
            </p>
            <a
              className="mt-2 inline-flex rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
              href={swDownloadUrl}
              target="_blank"
              rel="noreferrer"
            >
              Download sw.js
            </a>
          </div>

          <div className="rounded-lg bg-slate-50 p-4">
            <p className="font-medium">Step 2: Paste script before closing head tag</p>
            <p className="mt-1">Insert the code below just before the closing head tag on your website.</p>
          </div>
        </div>

        <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100">
{snippet}
        </pre>
      </div>
    </AppShell>
  );
}
