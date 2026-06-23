"use client";

import { BLOCKER_STATUS_OPTIONS, URGENCY_OPTIONS, labelFor } from "@/lib/constants";
import type { Blocker } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";

function Detail({ label, value }: { label: string; value: string }) {
  if (!value?.trim()) return null;
  return (
    <div>
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-0.5 whitespace-pre-wrap text-sm text-fg">{value}</p>
    </div>
  );
}

export function BlockerCard({
  blocker,
  onEdit,
  onCycleStatus,
  onDelete,
}: {
  blocker: Blocker;
  onEdit?: (b: Blocker) => void;
  onCycleStatus?: (b: Blocker) => void;
  onDelete?: (b: Blocker) => void;
}) {
  return (
    <article className="card">
      <div className="flex flex-wrap items-start gap-2">
        <h3 className="font-semibold leading-snug">{blocker.title}</h3>
        <div className="ml-auto flex shrink-0 gap-1.5">
          <StatusBadge
            label={`${labelFor(URGENCY_OPTIONS, blocker.urgency)} urgency`}
            value={blocker.urgency}
          />
          <button onClick={() => onCycleStatus?.(blocker)} title="Click to change status">
            <StatusBadge
              label={labelFor(BLOCKER_STATUS_OPTIONS, blocker.status)}
              value={blocker.status}
              className="cursor-pointer"
            />
          </button>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Detail label="Context" value={blocker.context} />
        <Detail label="What I tried" value={blocker.tried} />
        <Detail label="What I need from Cameron" value={blocker.needFromCameron} />
      </div>

      {(onEdit || onDelete) && (
        <div className="mt-3 flex justify-end gap-1">
          {onEdit && (
            <button onClick={() => onEdit(blocker)} className="btn-subtle h-7 !px-2 text-xs">
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(blocker)}
              className="btn-subtle h-7 !px-2 text-xs hover:text-rose-500"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </article>
  );
}
