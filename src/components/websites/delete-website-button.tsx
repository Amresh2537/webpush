"use client";

import { useRef, useState } from "react";
import { Trash2, AlertTriangle, X } from "lucide-react";

import { deleteWebsiteAction } from "@/actions/website-actions";
import { Button } from "@/components/ui/button";

export function DeleteWebsiteButton({
  websiteId,
  websiteName,
}: {
  websiteId: string;
  websiteName: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleDelete() {
    if (!formRef.current) return;
    setPending(true);
    const formData = new FormData(formRef.current);
    await deleteWebsiteAction(formData);
  }

  return (
    <>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="mr-1.5 h-4 w-4" />
        Delete Website
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">Delete website</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-4 text-sm text-slate-600">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-slate-900">{websiteName}</span>? This will
              permanently remove:
            </p>
            <ul className="mt-3 space-y-1 pl-4 text-sm text-slate-600">
              <li className="list-disc">All subscribers for this website</li>
              <li className="list-disc">All campaigns linked to this website</li>
              <li className="list-disc">All campaign stats and jobs</li>
            </ul>
            <p className="mt-3 text-sm font-semibold text-red-600">This cannot be undone.</p>

            <form ref={formRef}>
              <input type="hidden" name="websiteId" value={websiteId} />
            </form>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={pending}
                onClick={handleDelete}
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                {pending ? "Deleting…" : "Yes, delete it"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
