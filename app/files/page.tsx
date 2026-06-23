"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { FileIssueCard } from "@/components/FileIssueCard";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { Field, Select, TextArea, TextInput } from "@/components/Field";
import { FILE_ISSUE_TYPES, FILE_STATUS_OPTIONS } from "@/lib/constants";
import { fileIssueRepo } from "@/lib/repositories";
import { useCollection } from "@/lib/useCollection";
import type { FileIssue, FileIssueType, FileStatus } from "@/lib/types";

type FileInput = Omit<FileIssue, "id" | "createdAt" | "updatedAt">;

const EMPTY: FileInput = {
  project: "CounterCuing-01",
  participantId: "",
  fileName: "",
  issueType: "needs_review",
  status: "open",
  notes: "",
  fixAttempted: "",
  resolved: false,
};

export default function FilesPage() {
  const { items, loading, create, update, remove } = useCollection(fileIssueRepo);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FileIssue | null>(null);
  const [form, setForm] = useState<FileInput>(EMPTY);
  const [filter, setFilter] = useState<"open" | "all" | "resolved">("open");

  function startNew() {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  }
  function startEdit(f: FileIssue) {
    setEditing(f);
    setForm(f);
    setOpen(true);
  }
  function save(e: React.FormEvent) {
    e.preventDefault();
    if (editing) update(editing.id, form);
    else create(form);
    setOpen(false);
  }
  function set<K extends keyof FileInput>(k: K, v: FileInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  function toggleResolved(f: FileIssue) {
    update(f.id, {
      resolved: !f.resolved,
      status: !f.resolved ? "resolved" : "open",
    });
  }

  const shown = useMemo(() => {
    if (filter === "open") return items.filter((f) => !f.resolved);
    if (filter === "resolved") return items.filter((f) => f.resolved);
    return items;
  }, [items, filter]);

  const openCount = items.filter((f) => !f.resolved).length;

  return (
    <div>
      <PageHeader
        title="Files & Data Tracker"
        subtitle={`${openCount} open issue${openCount === 1 ? "" : "s"} across participant data and analysis.`}
        action={
          <button onClick={startNew} className="btn-primary">
            + New issue
          </button>
        }
      />

      {items.length > 0 && (
        <div className="mb-4 flex gap-1.5">
          {(["open", "all", "resolved"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={
                filter === f
                  ? "rounded-lg bg-accent-soft px-3 py-1.5 text-xs font-medium capitalize text-accent"
                  : "rounded-lg px-3 py-1.5 text-xs font-medium capitalize text-muted hover:bg-surface-2"
              }
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : items.length === 0 ? (
        <EmptyState
          title="No file issues tracked"
          description="Log participant/coder file problems, mismatched names, empty flash counts, or analysis crashes here."
        />
      ) : shown.length === 0 ? (
        <EmptyState
          title={`No ${filter} issues`}
          description="Switch the filter above to see other issues."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {shown.map((f) => (
            <FileIssueCard
              key={f.id}
              issue={f}
              onEdit={startEdit}
              onToggleResolved={toggleResolved}
              onDelete={(x) => remove(x.id)}
            />
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit file issue" : "New file issue"} wide>
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Dataset / project">
              <TextInput
                value={form.project}
                onChange={(e) => set("project", e.target.value)}
                placeholder="CounterCuing-01"
              />
            </Field>
            <Field label="Participant ID">
              <TextInput
                value={form.participantId}
                onChange={(e) => set("participantId", e.target.value)}
                placeholder="P014"
              />
            </Field>
            <Field label="File name / path">
              <TextInput
                value={form.fileName}
                onChange={(e) => set("fileName", e.target.value)}
                placeholder="P014_gaze.csv"
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Issue type">
              <Select
                options={FILE_ISSUE_TYPES}
                value={form.issueType}
                onChange={(e) => set("issueType", e.target.value as FileIssueType)}
              />
            </Field>
            <Field label="Status">
              <Select
                options={FILE_STATUS_OPTIONS}
                value={form.status}
                onChange={(e) => set("status", e.target.value as FileStatus)}
              />
            </Field>
          </div>
          <Field label="Notes">
            <TextArea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="What's wrong, what you noticed…"
            />
          </Field>
          <Field label="Fix attempted">
            <TextArea
              value={form.fixAttempted}
              onChange={(e) => set("fixAttempted", e.target.value)}
              className="min-h-[60px]"
            />
          </Field>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.resolved}
              onChange={(e) => set("resolved", e.target.checked)}
              className="h-4 w-4 rounded border-border accent-[rgb(var(--accent))]"
            />
            Mark as resolved
          </label>
          <div className="flex gap-2 pt-1">
            <button type="submit" className="btn-primary">
              {editing ? "Save changes" : "Create issue"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost">
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
