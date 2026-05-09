"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const params = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(event.currentTarget);

    const result = await signIn("credentials", {
      email: String(form.get("email") || ""),
      password: String(form.get("password") || ""),
      callbackUrl: "/dashboard",
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid credentials");
      setLoading(false);
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Log in to NotifyFlow</h1>
      <p className="mt-2 text-sm text-slate-600">
        Manage subscribers and send manual push campaigns.
      </p>

      {params.get("created") === "1" ? (
        <p className="mt-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">
          Account created. Check your console for the email verification link.
        </p>
      ) : null}

      {params.get("verified") === "1" ? (
        <p className="mt-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">
          Email verified. You can now log in.
        </p>
      ) : null}

      {params.get("verified") === "0" ? (
        <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          Verification link is invalid or expired.
        </p>
      ) : null}

      {error ? <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" required minLength={8} />
        </div>
        <Button disabled={loading} className="w-full" type="submit">
          {loading ? "Logging in..." : "Log in"}
        </Button>
      </form>

      <p className="mt-4 text-sm text-slate-600">
        Need an account?{" "}
        <Link className="font-medium text-slate-900 underline" href="/signup">
          Sign up
        </Link>
      </p>
    </div>
  );
}
