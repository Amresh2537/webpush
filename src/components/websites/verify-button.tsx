"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function VerifyButton({
  websiteId,
  method,
}: {
  websiteId: string;
  method: "META" | "DNS";
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function onVerify() {
    setLoading(true);
    setMessage("");

    const response = await fetch(`/api/websites/${websiteId}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method }),
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Verification failed");
      setLoading(false);
      return;
    }

    setMessage("Website verified successfully. Refreshing...");
    window.location.reload();
  }

  return (
    <div className="space-y-2">
      <Button onClick={onVerify} disabled={loading}>
        {loading ? "Checking..." : `Verify with ${method}`}
      </Button>
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </div>
  );
}
