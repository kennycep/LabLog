"use client";

import { cn } from "@/lib/cn";

export function TagSelector({
  options,
  selected,
  onChange,
}: {
  options: readonly string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  function toggle(tag: string) {
    onChange(
      selected.includes(tag)
        ? selected.filter((t) => t !== tag)
        : [...selected, tag]
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((tag) => {
        const active = selected.includes(tag);
        return (
          <button
            type="button"
            key={tag}
            onClick={() => toggle(tag)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition",
              active
                ? "border-transparent bg-accent text-white"
                : "border-border bg-surface text-muted hover:border-accent/40 hover:text-fg"
            )}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}
