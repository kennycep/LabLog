"use client";

import { GOAL_STATUS_OPTIONS, PRIORITY_OPTIONS, labelFor } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { Goal } from "@/lib/types";
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

export function GoalCard({
  goal,
  onEdit,
  onDelete,
}: {
  goal: Goal;
  onEdit?: (g: Goal) => void;
  onDelete?: (g: Goal) => void;
}) {
  return (
    <article className="card">
      <div className="flex flex-wrap items-start gap-2">
        <h3 className="font-semibold leading-snug">{goal.title}</h3>
        <div className="ml-auto flex shrink-0 gap-1.5">
          <StatusBadge
            label={labelFor(GOAL_STATUS_OPTIONS, goal.status)}
            value={goal.status}
          />
          <StatusBadge
            label={labelFor(PRIORITY_OPTIONS, goal.priority)}
            value={goal.priority}
          />
        </div>
      </div>

      {goal.description && (
        <p className="mt-2 text-sm text-muted">{goal.description}</p>
      )}

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Detail label="Current milestone" value={goal.currentMilestone} />
        <Detail label="Next milestone" value={goal.nextMilestone} />
        <Detail label="Notes" value={goal.notes} />
      </div>

      <div className="mt-4 flex items-center gap-3 text-xs text-muted">
        {goal.targetDate && <span>Target: {formatDate(goal.targetDate)}</span>}
        {(onEdit || onDelete) && (
          <div className="ml-auto flex gap-1">
            {onEdit && (
              <button onClick={() => onEdit(goal)} className="btn-subtle h-7 !px-2 text-xs">
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(goal)}
                className="btn-subtle h-7 !px-2 text-xs hover:text-rose-500"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
