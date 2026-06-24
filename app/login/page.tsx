"use client";

import { useState } from "react";
import { TextInput } from "@/components/Field";
import { getSupabase } from "@/lib/supabase";

const FEATURES = [
  "Log work sessions with time in / out and auto-calculated hours",
  "Track goals, tasks, blockers, and participant file issues",
  "Generate a Slack update or meeting agenda for Cameron in one click",
  "Everything synced privately across your phone and laptop",
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [error, setError] = useState("");

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setStatus("sending");
    setError("");
    try {
      const { error } = await getSupabase().auth.signInWithOtp({
        email: trimmed,
        options: {
          emailRedirectTo:
            typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });
      if (error) throw error;
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error ? err.message : "Could not send the magic link."
      );
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand / explanation */}
      <div className="hidden flex-col justify-between bg-surface-2/50 p-10 lg:flex">
        <div className="flex items-center gap-2 font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white">
            L
          </span>
          <span className="text-lg tracking-tight">LabLog</span>
        </div>
        <div className="max-w-md">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight">
            Your lab notebook and weekly update, in one place.
          </h1>
          <p className="mt-3 text-sm text-muted">
            A private work journal for research — log what you do each day, keep
            track of blockers and questions, and turn it all into a clean update
            for your PI.
          </p>
          <ul className="mt-6 space-y-2.5">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm">
                <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-muted">Private to you. Stored in your own account.</p>
      </div>

      {/* Auth form */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex items-center gap-2 font-semibold lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white">
              L
            </span>
            <span className="text-lg tracking-tight">LabLog</span>
          </div>

          {status === "sent" ? (
            <div className="panel p-6 text-center">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-accent/15 text-accent">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m3 7 9 6 9-6" />
                </svg>
              </div>
              <h2 className="text-base font-semibold">Check your email</h2>
              <p className="mt-1.5 text-sm text-muted">
                We sent a sign-in link to{" "}
                <span className="font-medium text-fg">{email}</span>. Open it on
                this device to continue.
              </p>
              <button
                onClick={() => setStatus("idle")}
                className="btn-subtle mt-4 text-sm"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold tracking-tight">
                Sign in to LabLog
              </h2>
              <p className="mt-1.5 text-sm text-muted">
                Enter your email and we&apos;ll send you a magic link — no
                password needed.
              </p>
              <form onSubmit={sendLink} className="mt-5 space-y-3">
                <TextInput
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@university.edu"
                  autoComplete="email"
                />
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="btn-primary w-full"
                >
                  {status === "sending" ? "Sending…" : "Send magic link"}
                </button>
                {status === "error" && (
                  <p className="text-sm text-rose-500">{error}</p>
                )}
              </form>
              <p className="mt-4 text-xs text-muted">
                By signing in you agree to keep your own lab data in this
                account. It&apos;s private to you.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
