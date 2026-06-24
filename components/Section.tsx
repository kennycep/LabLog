"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

// A labelled section of a notebook entry. Optionally collapsible (handy on
// mobile where the form gets long). The left rule + step letter give it a
// structured, journal-like feel rather than a stack of cards.
export function Section({
  step,
  title,
  hint,
  children,
  collapsible = false,
  defaultOpen = true,
  right,
}: {
  step?: string;
  title: string;
  hint?: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  right?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="border-t border-border pt-5 first:border-t-0 first:pt-0">
      <div className="flex items-center gap-2.5">
        {step && (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent-soft text-[11px] font-semibold text-accent">
            {step}
          </span>
        )}
        <button
          type="button"
          onClick={() => collapsible && setOpen((o) => !o)}
          className={cn(
            "flex flex-1 items-baseline gap-2 text-left",
            collapsible && "cursor-pointer"
          )}
        >
          <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
          {hint && <span className="text-xs text-muted">{hint}</span>}
        </button>
        {right}
        {collapsible && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="text-muted"
            aria-label={open ? "Collapse" : "Expand"}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn("transition", open ? "rotate-180" : "")}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        )}
      </div>
      {open && <div className="mt-4">{children}</div>}
    </section>
  );
}
