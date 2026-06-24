"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Navbar } from "./Navbar";
import { useAuth } from "./AuthProvider";

const PUBLIC_ROUTES = ["/login"];

function FullScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 text-center">
      {children}
    </div>
  );
}

function Spinner() {
  return (
    <span className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
  );
}

export function AppGate({ children }: { children: React.ReactNode }) {
  const { user, loading, configured } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = PUBLIC_ROUTES.includes(pathname);

  useEffect(() => {
    if (loading || !configured) return;
    if (!user && !isPublic) router.replace("/login");
    if (user && isPublic) router.replace("/");
  }, [user, loading, configured, isPublic, router]);

  // Misconfigured deploy — surface a clear message rather than a crash.
  if (!configured) {
    return (
      <FullScreen>
        <div className="max-w-md">
          <h1 className="text-lg font-semibold">LabLog isn&apos;t configured</h1>
          <p className="mt-2 text-sm text-muted">
            Set <code className="rounded bg-surface-2 px-1">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="rounded bg-surface-2 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
            in your environment, then redeploy. See the README for setup steps.
          </p>
        </div>
      </FullScreen>
    );
  }

  if (loading) {
    return (
      <FullScreen>
        <Spinner />
      </FullScreen>
    );
  }

  // Public route (login): render bare, no app chrome.
  if (isPublic) return <>{children}</>;

  // Protected route but not signed in — redirect is in flight.
  if (!user) {
    return (
      <FullScreen>
        <Spinner />
      </FullScreen>
    );
  }

  return (
    <>
      <Navbar />
      <main className="pb-safe mx-auto max-w-6xl px-4 py-6 pb-28 sm:py-8 md:pb-8">
        {children}
      </main>
    </>
  );
}
