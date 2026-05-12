"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { ChevronDown, ChevronUp, Send, FileText, AlertCircle } from "lucide-react";

import { createCampaignAction } from "@/actions/campaign-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Website = { id: string; name: string; domain: string };

const MESSAGE_MAX = 250;
const TITLE_MAX = 120;

function SubmitButtons() {
  const { pending } = useFormStatus();
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button type="submit" name="saveAsDraft" value="0" disabled={pending}>
        <Send className="mr-2 h-4 w-4" />
        {pending ? "Sending…" : "Send Now"}
      </Button>
      <Button
        type="submit"
        name="saveAsDraft"
        value="1"
        variant="secondary"
        disabled={pending}
      >
        <FileText className="mr-2 h-4 w-4" />
        {pending ? "Saving…" : "Save as Draft"}
      </Button>
    </div>
  );
}

export function CampaignForm({ websites }: { websites: Website[] }) {
  const [state, formAction] = useFormState(createCampaignAction, null);
  const [titleLen, setTitleLen] = useState(0);
  const [messageLen, setMessageLen] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);

  // Scroll to error when it appears
  useEffect(() => {
    if (state?.error) {
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-6">
      {state?.error ? (
        <div
          ref={errorRef}
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      ) : null}

      {/* Main details */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Notification details</h2>
        <p className="mt-1 text-sm text-slate-500">
          Fill in the content of your push notification.
        </p>

        <div className="mt-6 space-y-5">
          {/* Website selector */}
          <div className="space-y-2">
            <Label htmlFor="websiteId">Website</Label>
            <Select
              id="websiteId"
              name="websiteId"
              required
              defaultValue=""
              options={[
                { value: "", label: "Select a verified website…" },
                ...websites.map((w) => ({
                  value: w.id,
                  label: `${w.name} — ${w.domain}`,
                })),
              ]}
            />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="title">Title</Label>
              <span
                className={`text-xs tabular-nums ${titleLen > TITLE_MAX - 10 ? "text-red-500" : "text-slate-400"}`}
              >
                {titleLen}/{TITLE_MAX}
              </span>
            </div>
            <Input
              id="title"
              name="title"
              required
              maxLength={TITLE_MAX}
              placeholder="e.g. New offer just for you!"
              onChange={(e) => setTitleLen(e.target.value.length)}
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="message">Message</Label>
              <span
                className={`text-xs tabular-nums ${messageLen > MESSAGE_MAX - 20 ? "text-red-500" : "text-slate-400"}`}
              >
                {messageLen}/{MESSAGE_MAX}
              </span>
            </div>
            <Textarea
              id="message"
              name="message"
              required
              maxLength={MESSAGE_MAX}
              rows={3}
              placeholder="e.g. Tap to see what's waiting for you…"
              onChange={(e) => setMessageLen(e.target.value.length)}
            />
          </div>

          {/* Click URL */}
          <div className="space-y-2">
            <Label htmlFor="clickUrl">Click URL</Label>
            <Input
              id="clickUrl"
              name="clickUrl"
              type="url"
              required
              placeholder="https://yourwebsite.com/offer"
            />
            <p className="text-xs text-slate-500">
              Where users land when they tap the notification.
            </p>
          </div>

          {/* Icon URL */}
          <div className="space-y-2">
            <Label htmlFor="iconUrl">
              Icon URL{" "}
              <span className="ml-1 font-normal text-slate-400">(optional)</span>
            </Label>
            <Input
              id="iconUrl"
              name="iconUrl"
              type="url"
              placeholder="https://yourwebsite.com/icon.png"
            />
            <p className="text-xs text-slate-500">
              Square image shown next to the notification (192×192px recommended).
            </p>
          </div>
        </div>
      </div>

      {/* Audience targeting — collapsible */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <button
          type="button"
          className="flex w-full items-center justify-between text-left"
          onClick={() => setShowAdvanced((v) => !v)}
        >
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Audience targeting</h2>
            <p className="mt-1 text-sm text-slate-500">
              Filter by browser, timezone, or date range.{" "}
              <span className="text-slate-400">Optional</span>
            </p>
          </div>
          {showAdvanced ? (
            <ChevronUp className="h-5 w-5 text-slate-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-400" />
          )}
        </button>

        {showAdvanced && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="browser">Browser</Label>
              <Select
                id="browser"
                name="browser"
                defaultValue=""
                options={[
                  { value: "", label: "All browsers" },
                  { value: "Chrome", label: "Chrome" },
                  { value: "Firefox", label: "Firefox" },
                  { value: "Safari", label: "Safari" },
                  { value: "Edge", label: "Edge" },
                ]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Timezone</Label>
              <Input id="location" name="location" placeholder="e.g. Asia/Kolkata" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fromDate">Subscribed from</Label>
              <Input id="fromDate" name="fromDate" type="date" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="toDate">Subscribed until</Label>
              <Input id="toDate" name="toDate" type="date" />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="scheduleAt">
                Schedule for later{" "}
                <span className="ml-1 font-normal text-slate-400">(optional)</span>
              </Label>
              <Input id="scheduleAt" name="scheduleAt" type="datetime-local" />
              <p className="text-xs text-slate-500">
                Leave empty to send immediately.
              </p>
            </div>
          </div>
        )}
      </div>

      <SubmitButtons />
    </form>
  );
}
