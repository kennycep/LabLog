import { cn } from "@/lib/cn";

type Tone =
  | "neutral"
  | "accent"
  | "green"
  | "amber"
  | "red"
  | "blue"
  | "purple";

const TONES: Record<Tone, string> = {
  neutral: "bg-surface-2 text-muted border-border",
  accent: "bg-accent-soft text-accent border-transparent",
  green:
    "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border-transparent",
  amber:
    "bg-amber-500/14 text-amber-600 dark:text-amber-400 border-transparent",
  red: "bg-rose-500/12 text-rose-600 dark:text-rose-400 border-transparent",
  blue: "bg-sky-500/12 text-sky-600 dark:text-sky-400 border-transparent",
  purple:
    "bg-violet-500/14 text-violet-600 dark:text-violet-400 border-transparent",
};

// Maps domain values to a tone so badges read consistently across the app.
const VALUE_TONE: Record<string, Tone> = {
  // priority / urgency
  low: "neutral",
  medium: "amber",
  high: "red",
  // task / goal status
  backlog: "neutral",
  this_week: "blue",
  today: "accent",
  blocked: "red",
  done: "green",
  not_started: "neutral",
  in_progress: "blue",
  // blocker status
  open: "amber",
  discussed: "blue",
  resolved: "green",
  // confidence
  struggling: "amber",
  steady: "blue",
  confident: "green",
};

export function StatusBadge({
  label,
  value,
  tone,
  className,
}: {
  label: string;
  value?: string;
  tone?: Tone;
  className?: string;
}) {
  const resolved = tone ?? (value ? VALUE_TONE[value] ?? "neutral" : "neutral");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        TONES[resolved],
        className
      )}
    >
      {label}
    </span>
  );
}
