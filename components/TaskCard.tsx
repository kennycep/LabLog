"use client";

import { PRIORITY_OPTIONS, labelFor } from "@/lib/constants";
import { fmtHours, formatDate } from "@/lib/format";
import type { Goal, Task } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";

export function TaskCard({
  task,
  goal,
  onEdit,
  onLogHours,
  draggable = true,
  onDragStart,
}: {
  task: Task;
  goal?: Goal;
  onEdit?: (t: Task) => void;
  onLogHours?: (t: Task) => void;
  draggable?: boolean;
  onDragStart?: (t: Task) => void;
}) {
  const overdue =
    task.dueDate &&
    task.status !== "done" &&
    task.dueDate < new Date().toISOString().slice(0, 10);

  return (
    <article
      draggable={draggable}
      onDragStart={() => onDragStart?.(task)}
      className="group cursor-grab rounded-xl border border-border bg-surface p-3 shadow-sm transition hover:border-accent/40 active:cursor-grabbing"
    >
      <div className="flex items-start gap-2">
        <p className="flex-1 text-sm font-medium leading-snug">{task.title}</p>
        {onEdit && (
          <button
            onClick={() => onEdit(task)}
            className="text-xs text-muted opacity-0 transition hover:text-fg group-hover:opacity-100"
          >
            Edit
          </button>
        )}
      </div>

      {task.description && (
        <p className="mt-1 line-clamp-2 text-xs text-muted">{task.description}</p>
      )}

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <StatusBadge
          label={labelFor(PRIORITY_OPTIONS, task.priority)}
          value={task.priority}
        />
        {goal && <StatusBadge label={goal.title} tone="purple" />}
        {task.questionForCameron?.trim() && (
          <StatusBadge label="? Cameron" tone="amber" />
        )}
        {task.dueDate && (
          <span className={overdue ? "text-xs font-medium text-rose-500" : "text-xs text-muted"}>
            {formatDate(task.dueDate)}
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
        <span className="text-xs text-muted">{fmtHours(task.hoursSpent)}h logged</span>
        {onLogHours && (
          <button
            onClick={() => onLogHours(task)}
            className="text-xs font-medium text-accent hover:underline"
          >
            + Log hours
          </button>
        )}
      </div>
    </article>
  );
}
