import Link from "next/link";

import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function Home() {
  let session = null;
  try {
    session = await auth();
  } catch {
    // auth() may throw if NEXTAUTH_SECRET is missing; render unauthenticated state
  }

  return (
    <main className="min-h-screen px-6 py-12 md:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between">
          <p className="mono text-sm uppercase tracking-[0.24em] text-teal-700">NotifyFlow</p>
          <div className="flex items-center gap-3">
            {session ? (
              <Button asChild>
                <Link href="/dashboard">Open Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="outline" asChild>
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Start free</Link>
                </Button>
              </>
            )}
          </div>
        </header>

        <section className="mt-16 grid items-center gap-10 md:grid-cols-2">
          <div>
            <h1 className="text-5xl font-semibold leading-tight text-slate-900 md:text-6xl">
              Manual push broadcasts for teams that move fast.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-slate-700">
              NotifyFlow helps you capture subscribers, segment audiences, schedule campaigns,
              and send at reliable scale with queue-backed delivery.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href={session ? "/dashboard" : "/signup"}>Build your first campaign</Link>
              </Button>
              <Button size="lg" variant="secondary" asChild>
                <Link href="/onboarding">Connect website</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-3xl border border-teal-100 bg-white p-6 shadow-xl shadow-teal-100/60">
            <p className="mono text-xs uppercase tracking-[0.24em] text-teal-600">Real-time Snapshot</p>
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-slate-900 p-4 text-white">
                <p className="mono text-xs text-slate-300">Subscribers</p>
                <p className="mt-2 text-2xl font-semibold">18,420</p>
              </div>
              <div className="rounded-xl bg-teal-600 p-4 text-white">
                <p className="mono text-xs text-teal-100">Sent Today</p>
                <p className="mt-2 text-2xl font-semibold">12,400</p>
              </div>
              <div className="rounded-xl bg-cyan-600 p-4 text-white">
                <p className="mono text-xs text-cyan-100">CTR</p>
                <p className="mt-2 text-2xl font-semibold">7.2%</p>
              </div>
            </div>
            <p className="mt-6 text-sm text-slate-600">
              Free tier supports up to 1,000 subscribers per workspace.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
