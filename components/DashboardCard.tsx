import Link from "next/link";
import { cn } from "@/lib/cn";

export function DashboardCard({
  title,
  icon,
  href,
  count,
  children,
  className,
  action,
}: {
  title: string;
  icon?: React.ReactNode;
  href?: string;
  count?: number | string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <section className={cn("card flex flex-col", className)}>
      <div className="mb-3 flex items-center gap-2">
        {icon && <span className="text-accent">{icon}</span>}
        <h2 className="text-sm font-semibold text-fg">{title}</h2>
        {count !== undefined && (
          <span className="ml-0.5 rounded-full bg-surface-2 px-2 py-0.5 text-xs font-medium text-muted">
            {count}
          </span>
        )}
        {href && (
          <Link
            href={href}
            className="ml-auto text-xs font-medium text-accent hover:underline"
          >
            View all
          </Link>
        )}
        {action && <div className="ml-auto">{action}</div>}
      </div>
      <div className="flex-1">{children}</div>
    </section>
  );
}

// Compact metric used in the dashboard stat row.
export function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "card",
        accent && "border-accent/30 bg-accent-soft/40"
      )}
    >
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </div>
  );
}
