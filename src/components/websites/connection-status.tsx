"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Loader2, RefreshCw, Users, Wifi, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

type StatusData = {
  isVerified: boolean;
  subscriberCount: number;
  connected: boolean;
};

export function ConnectionStatus({
  websiteId,
  initial,
}: {
  websiteId: string;
  initial: StatusData;
}) {
  const [status, setStatus] = useState<StatusData>(initial);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  async function check() {
    setLoading(true);
    try {
      const res = await fetch(`/api/websites/${websiteId}/status`);
      if (res.ok) {
        const data = await res.json() as StatusData;
        setStatus(data);
        setLastChecked(new Date());
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Connection Status</h2>
          {lastChecked ? (
            <p className="mt-0.5 text-xs text-slate-400">
              Last checked: {lastChecked.toLocaleTimeString()}
            </p>
          ) : null}
        </div>
        <Button variant="outline" size="sm" onClick={check} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="ml-1.5">Check now</span>
        </Button>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div
          className={`rounded-xl p-4 text-center ${status.isVerified ? "bg-emerald-50" : "bg-amber-50"}`}
        >
          <ShieldCheck
            className={`mx-auto h-6 w-6 ${status.isVerified ? "text-emerald-600" : "text-amber-500"}`}
          />
          <p
            className={`mt-2 text-xs font-semibold ${status.isVerified ? "text-emerald-700" : "text-amber-700"}`}
          >
            {status.isVerified ? "Verified" : "Unverified"}
          </p>
        </div>

        <div
          className={`rounded-xl p-4 text-center ${status.connected ? "bg-emerald-50" : "bg-slate-50"}`}
        >
          <Wifi
            className={`mx-auto h-6 w-6 ${status.connected ? "text-emerald-600" : "text-slate-400"}`}
          />
          <p
            className={`mt-2 text-xs font-semibold ${status.connected ? "text-emerald-700" : "text-slate-500"}`}
          >
            {status.connected ? "SDK Active" : "No signal"}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-4 text-center">
          <div className="flex items-center justify-center gap-1">
            <Users className="h-5 w-5 text-slate-600" />
            <span className="text-xl font-bold text-slate-800">{status.subscriberCount}</span>
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-500">Subscribers</p>
        </div>
      </div>

      {status.connected ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Connection successful — SDK is active and collecting subscribers!
        </div>
      ) : !status.isVerified ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <XCircle className="h-4 w-4 shrink-0" />
          Complete ownership verification before installing the SDK.
        </div>
      ) : (
        <div className="mt-4 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <p className="font-semibold">Waiting for first connection</p>
          <p className="mt-0.5 text-xs">
            Install the SDK on your website, visit it in a browser, and allow notifications. Then
            click <strong>Check now</strong>.
          </p>
        </div>
      )}
    </div>
  );
}
