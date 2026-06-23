"use client";

import { CONFIDENCE_OPTIONS, labelFor } from "@/lib/constants";
import { fmtHours, formatDate } from "@/lib/format";
import type { DailyLog } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";

function LogField({ label, value }: { label: string; value: string }) {
  if (!value?.trim()) return null;
  return (
    <div>
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-0.5 whitespace-pre-wrap text-sm text-fg">{value}</p>
    </div>
  );
}

export function LogCard({
  log,
  onEdit,
  onDelete,
  compact = false,
}: {
  log: DailyLog;
  onEdit?: (log: DailyLog) => void;
  onDelete?: (log: DailyLog) => void;
  compact?: boolean;
}) {
  return (
    <article className="card">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold">{formatDate(log.date)}</h3>
        <StatusBadge
          label={labelFor(CONFIDENCE_OPTIONS, log.confidence)}
          value={log.confidence}
        />
        <span className="text-xs text-muted">
          {fmtHours(log.hours)}h task · {fmtHours(log.labHours)}h lab
        </span>
        {(onEdit || onDelete) && (
          <div className="ml-auto flex gap-1">
            {onEdit && (
              <button onClick={() => onEdit(log)} className="btn-subtle h-7 !px-2 text-xs">
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(log)}
                className="btn-subtle h-7 !px-2 text-xs hover:text-rose-500"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      {log.focus && (
        <p className="mt-2 text-sm font-medium text-fg">{log.focus}</p>
      )}

      {log.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {log.tags.map((t) => (
            <StatusBadge key={t} label={t} tone="accent" />
          ))}
        </div>
      )}

      {!compact && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <LogField label="What I did" value={log.did} />
          <LogField label="Progress" value={log.progress} />
          <LogField label="Files touched" value={log.filesTouched} />
          <LogField label="Blockers" value={log.blockers} />
          <LogField label="What I tried" value={log.tried} />
          <LogField label="Questions for Cameron" value={log.questions} />
          <LogField label="Next steps" value={log.nextSteps} />
        </div>
      )}
    </article>
  );
}
