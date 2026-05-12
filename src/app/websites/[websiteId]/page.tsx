import { notFound, redirect } from "next/navigation";
import { Download } from "lucide-react";

import { getAppUrl } from "@/lib/app-url";
import { getInstallSnippet } from "@/lib/sdk";
import { AppShell } from "@/components/dashboard/app-shell";
import { VerifyButton } from "@/components/websites/verify-button";
import { ConnectionStatus } from "@/components/websites/connection-status";
import { CopyButton } from "@/components/websites/copy-button";
import { DeleteWebsiteButton } from "@/components/websites/delete-website-button";

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
    where: { id: params.websiteId, userId: session.user.id },
    include: { _count: { select: { subscribers: true } } },
  });

  if (!website) {
    notFound();
  }

  const snippet = getInstallSnippet(website);
  const appUrl = getAppUrl();
  const swDownloadUrl = `${appUrl}/sw.js`;

  const initialStatus = {
    isVerified: website.isVerified,
    subscriberCount: website._count.subscribers,
    connected: website.isVerified && website._count.subscribers > 0,
  };

  const metaTag = `<meta name="notifyflow-verification" content="${website.ownershipToken}" />`;
  const dnsTxtRecord = `notifyflow-verification=${website.ownershipToken}`;

  return (
    <AppShell
      title={website.name}
      description={website.domain}
      active="websites"
      actions={
        <DeleteWebsiteButton websiteId={website.id} websiteName={website.name} />
      }
    >
      <div className="space-y-6">

        {/* ── 1. Connection Status ─────────────────────────────── */}
        <ConnectionStatus websiteId={website.id} initial={initialStatus} />

        {/* ── 2. Integration Guide ─────────────────────────────── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold">Integration Guide</h2>
          <p className="mt-1 text-sm text-slate-500">
            Follow these four steps to install NotifyFlow on your website.
          </p>

          <ol className="mt-6 space-y-8">
            {/* Step 1 */}
            <li className="flex gap-4">
              <StepBadge n={1} done={website.isVerified} />
              <div className="flex-1">
                <p className="font-semibold text-slate-800">Verify ownership</p>
                <p className="mt-1 text-sm text-slate-500">
                  Prove you own this domain before collecting subscribers. Use the{" "}
                  <strong>Ownership Verification</strong> section below to add a meta tag or DNS
                  TXT record, then click <strong>Verify</strong>.
                </p>
                {website.isVerified ? (
                  <p className="mt-2 text-xs font-semibold text-emerald-600">✓ Complete</p>
                ) : (
                  <p className="mt-2 text-xs font-semibold text-amber-600">
                    Pending — see Ownership Verification below
                  </p>
                )}
              </div>
            </li>

            {/* Step 2 */}
            <li className="flex gap-4">
              <StepBadge n={2} done={false} />
              <div className="flex-1">
                <p className="font-semibold text-slate-800">Upload the service worker</p>
                <p className="mt-1 text-sm text-slate-500">
                  Download <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">sw.js</code>{" "}
                  and place it at the root of your website so it is accessible at{" "}
                  <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">
                    {website.domain}/sw.js
                  </code>
                  .
                </p>
                <a
                  href={swDownloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download sw.js
                </a>
              </div>
            </li>

            {/* Step 3 */}
            <li className="flex gap-4">
              <StepBadge n={3} done={false} />
              <div className="flex-1">
                <p className="font-semibold text-slate-800">Paste the SDK snippet</p>
                <p className="mt-1 text-sm text-slate-500">
                  Copy the snippet below and paste it just before the closing{" "}
                  <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">&lt;/head&gt;</code>{" "}
                  tag on every page of your website.
                </p>
                <div className="mt-3 overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
                  <div className="flex items-center justify-between border-b border-slate-700 px-4 py-2">
                    <span className="text-xs text-slate-400">HTML — paste before &lt;/head&gt;</span>
                    <CopyButton text={snippet} />
                  </div>
                  <pre className="overflow-x-auto px-4 py-4 text-xs leading-relaxed text-slate-100">
                    {snippet}
                  </pre>
                </div>
              </div>
            </li>

            {/* Step 4 */}
            <li className="flex gap-4">
              <StepBadge n={4} done={initialStatus.connected} />
              <div className="flex-1">
                <p className="font-semibold text-slate-800">Test the connection</p>
                <p className="mt-1 text-sm text-slate-500">
                  Open your website in a browser, click <strong>Allow</strong> when prompted for
                  notification permission, then return here and click{" "}
                  <strong>Check now</strong> in the Connection Status card above to confirm the
                  SDK is working.
                </p>
                {initialStatus.connected ? (
                  <p className="mt-2 text-xs font-semibold text-emerald-600">
                    ✓ Connection confirmed — {initialStatus.subscriberCount} subscriber
                    {initialStatus.subscriberCount !== 1 ? "s" : ""} collected
                  </p>
                ) : null}
              </div>
            </li>
          </ol>
        </div>

        {/* ── 3. Ownership Verification ────────────────────────── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold">Ownership Verification</h2>
          <p className="mt-1 text-sm text-slate-500">
            Add one of the options below to your website, then click the corresponding Verify
            button.
          </p>

          <div className="mt-5 space-y-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">Option A — Meta tag</p>
                <CopyButton text={metaTag} />
              </div>
              <pre className="mt-2 overflow-x-auto text-xs text-slate-700">{metaTag}</pre>
              <p className="mt-2 text-xs text-slate-500">
                Paste inside the <code>&lt;head&gt;</code> of your homepage.
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">Option B — DNS TXT record</p>
                <CopyButton text={dnsTxtRecord} />
              </div>
              <pre className="mt-2 overflow-x-auto text-xs text-slate-700">{dnsTxtRecord}</pre>
              <p className="mt-2 text-xs text-slate-500">
                Add as a TXT record on your domain&apos;s DNS settings. Changes may take up to 24h
                to propagate.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <VerifyButton websiteId={website.id} method="META" />
            <VerifyButton websiteId={website.id} method="DNS" />
            <span
              className={`text-sm font-medium ${website.isVerified ? "text-emerald-600" : "text-amber-600"}`}
            >
              {website.isVerified ? "✓ Verified" : "Not verified yet"}
            </span>
          </div>
        </div>

        {/* ── 4. VAPID Keys ────────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold">VAPID Keys</h2>
          <p className="mt-1 text-sm text-slate-500">
            These are automatically embedded in the SDK snippet. Keep the private key secret.
          </p>

          <div className="mt-5 space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-600">Public key</p>
                <CopyButton text={website.vapidPublicKey} />
              </div>
              <pre className="mt-1 overflow-x-auto rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-700">
                {website.vapidPublicKey}
              </pre>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-600">Private key</p>
                <CopyButton text={website.vapidPrivateKey} />
              </div>
              <pre className="mt-1 overflow-x-auto rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-700">
                {"•".repeat(40)}
              </pre>
              <p className="mt-1 text-xs text-slate-400">Use Copy to access the actual value.</p>
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  );
}

function StepBadge({ n, done }: { n: number; done: boolean }) {
  return (
    <div
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
        done ? "bg-emerald-500 text-white" : "bg-slate-900 text-white"
      }`}
    >
      {done ? "✓" : n}
    </div>
  );
}
