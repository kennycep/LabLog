"use client";

import { FILE_ISSUE_TYPES, FILE_STATUS_OPTIONS, labelFor } from "@/lib/constants";
import type { FileIssue } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";

export function FileIssueCard({
  issue,
  onEdit,
  onToggleResolved,
  onDelete,
}: {
  issue: FileIssue;
  onEdit?: (f: FileIssue) => void;
  onToggleResolved?: (f: FileIssue) => void;
  onDelete?: (f: FileIssue) => void;
}) {
  const title =
    issue.fileName || issue.participantId || issue.project || "Untitled file";
  return (
    <article className="card">
      <div className="flex flex-wrap items-start gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-semibold">{title}</h3>
          <p className="mt-0.5 text-xs text-muted">
            {[issue.project, issue.participantId].filter(Boolean).join(" · ") ||
              "No project/participant"}
          </p>
        </div>
        <div className="ml-auto flex shrink-0 flex-wrap justify-end gap-1.5">
          <StatusBadge
            label={labelFor(FILE_ISSUE_TYPES, issue.issueType)}
            tone={issue.resolved ? "green" : "amber"}
          />
          <StatusBadge
            label={issue.resolved ? "Resolved" : labelFor(FILE_STATUS_OPTIONS, issue.status)}
            value={issue.resolved ? "resolved" : issue.status}
          />
        </div>
      </div>

      {issue.notes?.trim() && (
        <p className="mt-3 whitespace-pre-wrap text-sm text-fg">{issue.notes}</p>
      )}
      {issue.fixAttempted?.trim() && (
        <div className="mt-2">
          <p className="text-xs font-medium text-muted">Fix attempted</p>
          <p className="mt-0.5 whitespace-pre-wrap text-sm text-fg">
            {issue.fixAttempted}
          </p>
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted">
          <input
            type="checkbox"
            checked={issue.resolved}
            onChange={() => onToggleResolved?.(issue)}
            className="h-3.5 w-3.5 rounded border-border accent-[rgb(var(--accent))]"
          />
          Resolved
        </label>
        <div className="ml-auto flex gap-1">
          {onEdit && (
            <button onClick={() => onEdit(issue)} className="btn-subtle h-7 !px-2 text-xs">
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(issue)}
              className="btn-subtle h-7 !px-2 text-xs hover:text-rose-500"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
