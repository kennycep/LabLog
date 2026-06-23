"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { useTheme } from "./ThemeProvider";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/daily", label: "Daily Log" },
  { href: "/goals", label: "Goals" },
  { href: "/tasks", label: "Tasks" },
  { href: "/blockers", label: "Blockers" },
  { href: "/files", label: "Files" },
  { href: "/weekly", label: "Weekly" },
];

// Primary destinations for the mobile bottom bar (the + is the Daily Log).
const BOTTOM = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/tasks", label: "Tasks", icon: BoardIcon },
  { href: "/blockers", label: "Blockers", icon: FlagIcon },
  { href: "/weekly", label: "Weekly", icon: DocIcon },
];

export function Navbar() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  // Theme isn't known until after mount; render a stable placeholder first so
  // server and client markup match (avoids a hydration mismatch on the icon).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">
              L
            </span>
            <span className="tracking-tight">LabLog</span>
          </Link>

          <nav className="ml-3 hidden items-center gap-0.5 md:flex">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                  isActive(l.href)
                    ? "bg-accent-soft text-accent"
                    : "text-muted hover:bg-surface-2 hover:text-fg"
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            <Link href="/daily" className="btn-primary hidden h-9 sm:inline-flex">
              + Log
            </Link>
            <button
              onClick={toggle}
              className="btn-subtle h-9 w-9 !px-0"
              aria-label="Toggle theme"
              suppressHydrationWarning
              title={
                mounted
                  ? theme === "dark"
                    ? "Switch to light"
                    : "Switch to dark"
                  : "Toggle theme"
              }
            >
              {mounted ? (
                theme === "dark" ? (
                  <SunIcon />
                ) : (
                  <MoonIcon />
                )
              ) : (
                <span className="h-[17px] w-[17px]" />
              )}
            </button>
            <button
              onClick={() => setOpen((o) => !o)}
              className="btn-subtle h-9 w-9 !px-0 md:hidden"
              aria-label="All pages"
            >
              <MenuIcon />
            </button>
          </div>
        </div>

        {/* Full menu sheet (mobile) */}
        {open && (
          <nav className="border-t border-border bg-surface px-2 py-2 md:hidden">
            <div className="grid grid-cols-2 gap-1">
              {LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-lg px-3 py-2.5 text-sm font-medium",
                    isActive(l.href)
                      ? "bg-accent-soft text-accent"
                      : "text-muted hover:bg-surface-2"
                  )}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </header>

      {/* Bottom tab bar (mobile only) */}
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/95 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 items-end px-2 pt-1.5">
          {BOTTOM.slice(0, 2).map((l) => (
            <TabLink key={l.href} {...l} active={isActive(l.href)} />
          ))}

          {/* Center raised Log action */}
          <div className="flex justify-center">
            <Link
              href="/daily"
              className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-accent/30 active:scale-95"
              aria-label="New daily log"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </Link>
          </div>

          {BOTTOM.slice(2).map((l) => (
            <TabLink key={l.href} {...l} active={isActive(l.href)} />
          ))}
        </div>
      </nav>
    </>
  );
}

function TabLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: () => JSX.Element;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] font-medium transition",
        active ? "text-accent" : "text-muted"
      )}
    >
      <Icon />
      {label}
    </Link>
  );
}

function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
    </svg>
  );
}
function BoardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="18" rx="1" />
      <rect x="14" y="3" width="7" height="11" rx="1" />
    </svg>
  );
}
function FlagIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 21V4h12l-2 4 2 4H4" />
    </svg>
  );
}
function DocIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7z" />
      <path d="M14 3v4h4M9 13h6M9 17h6" />
    </svg>
  );
}
function SunIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}
function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="5" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="19" cy="12" r="1.5" />
    </svg>
  );
}
