"use client";

import { useState } from "react";
import { CONFIDENCE_OPTIONS, labelFor } from "@/lib/constants";
import { fmtHours, formatDate } from "@/lib/format";
import { dailyLabHours, sessionRangeLabel } from "@/lib/time";
import type { ConfidenceLevel, DailyLog } from "@/lib/types";

const CONFIDENCE_DOT: Record<ConfidenceLevel, string> = {
  blocked: "bg-rose-500",
  struggling: "bg-amber-500",
  steady: "bg-sky-500",
  confident: "bg-emerald-500",
};

function Detail({ label, value }: { label: string; value: string }) {
  if (!value?.trim()) return null;
  return (
    <div className="border-l-2 border-border pl-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed text-fg">
        {value}
      </p>
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
  const [zoom, setZoom] = useState<string | null>(null);

  return (
    <article className="panel p-4 sm:p-5">
      {/* Header line */}
      <div className="flex items-center gap-2.5">
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${CONFIDENCE_DOT[log.confidence]}`}
          title={labelFor(CONFIDENCE_OPTIONS, log.confidence)}
        />
        <h3 className="text-sm font-semibold">{formatDate(log.date)}</h3>
        <span className="text-xs text-muted">
          {fmtHours(dailyLabHours(log))}h lab
          {log.hoursOnTask > 0 && ` · ${fmtHours(log.hoursOnTask)}h focused`}
        </span>
        {(onEdit || onDelete) && (
          <div className="ml-auto flex gap-0.5">
            {onEdit && (
              <button
                onClick={() => onEdit(log)}
                className="rounded-md px-2 py-1 text-xs text-muted hover:bg-surface-2 hover:text-fg"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(log)}
                className="rounded-md px-2 py-1 text-xs text-muted hover:bg-surface-2 hover:text-rose-500"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      {log.focus && (
        <p className="mt-2 text-[15px] font-medium leading-snug text-fg">
          {log.focus}
        </p>
      )}

      {/* Meta row: tags + worked-for */}
      {(log.tags.length > 0 || log.workedFor.length > 0) && (
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
          {log.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {log.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] font-medium text-muted"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
          {log.workedFor.length > 0 && (
            <span className="text-muted">
              <span className="text-fg/80">For</span> {log.workedFor.join(", ")}
            </span>
          )}
        </div>
      )}

      {/* Session ranges */}
      {!compact && log.sessions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {log.sessions.map((s) => {
            const range = sessionRangeLabel(s);
            if (!range) return null;
            return (
              <span
                key={s.id}
                className="rounded-md border border-border px-2 py-0.5 text-[11px] text-muted"
              >
                {range}
              </span>
            );
          })}
        </div>
      )}

      {!compact && (
        <div className="mt-4 space-y-3">
          <Detail label="What I did" value={log.did} />
          <Detail label="Progress" value={log.progress} />
          <Detail label="Files touched" value={log.filesTouched} />
          <Detail label="Blockers" value={log.blockers} />
          <Detail label="What I tried" value={log.tried} />
          <Detail label="Questions for Cameron" value={log.questions} />
          <Detail label="Next steps" value={log.nextSteps} />
        </div>
      )}

      {/* Image thumbnails */}
      {log.images.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {log.images.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src}
              alt={`Log attachment ${i + 1}`}
              onClick={() => setZoom(src)}
              className="h-16 w-16 cursor-zoom-in rounded-lg border border-border object-cover"
            />
          ))}
        </div>
      )}

      {zoom && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setZoom(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={zoom}
            alt="Attachment"
            className="max-h-full max-w-full rounded-lg object-contain"
          />
        </div>
      )}
    </article>
  );
}
