"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { TaskCard } from "@/components/TaskCard";
import { Modal } from "@/components/Modal";
import { EmptyState } from "@/components/EmptyState";
import { Field, Select, TextArea, TextInput } from "@/components/Field";
import { PRIORITY_OPTIONS, TASK_COLUMNS } from "@/lib/constants";
import { goalRepo, taskRepo } from "@/lib/repositories";
import { useCollection } from "@/lib/useCollection";
import { fmtHours } from "@/lib/format";
import type { Priority, Task, TaskStatus } from "@/lib/types";

type TaskInput = Omit<Task, "id" | "createdAt" | "updatedAt">;

const EMPTY: TaskInput = {
  title: "",
  description: "",
  priority: "medium",
  status: "backlog",
  relatedGoalId: "",
  dueDate: "",
  notes: "",
  relatedFiles: "",
  questionForCameron: "",
  hoursSpent: 0,
};

export default function TasksPage() {
  const { items: tasks, loading, create, update, remove } = useCollection(taskRepo);
  const { items: goals } = useCollection(goalRepo);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState<TaskInput>(EMPTY);
  const [dragId, setDragId] = useState<string | null>(null);

  const [hoursModal, setHoursModal] = useState<Task | null>(null);
  const [hoursToAdd, setHoursToAdd] = useState("");

  const goalById = useMemo(
    () => Object.fromEntries(goals.map((g) => [g.id, g])),
    [goals]
  );

  const grouped = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      backlog: [],
      this_week: [],
      today: [],
      blocked: [],
      done: [],
    };
    for (const t of tasks) map[t.status].push(t);
    return map;
  }, [tasks]);

  function startNew(status: TaskStatus = "backlog") {
    setEditing(null);
    setForm({ ...EMPTY, status });
    setOpen(true);
  }
  function startEdit(t: Task) {
    setEditing(t);
    setForm(t);
    setOpen(true);
  }
  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (editing) update(editing.id, form);
    else create(form);
    setOpen(false);
  }
  function set<K extends keyof TaskInput>(k: K, v: TaskInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function onDrop(status: TaskStatus) {
    if (dragId) update(dragId, { status });
    setDragId(null);
  }

  function saveHours() {
    if (!hoursModal) return;
    const add = Number(hoursToAdd) || 0;
    update(hoursModal.id, { hoursSpent: (hoursModal.hoursSpent || 0) + add });
    setHoursModal(null);
    setHoursToAdd("");
  }

  const totalLogged = tasks.reduce((s, t) => s + (t.hoursSpent || 0), 0);

  return (
    <div>
      <PageHeader
        title="Tasks"
        subtitle={`Drag cards between columns · ${fmtHours(totalLogged)}h logged across tasks`}
        action={
          <button onClick={() => startNew()} className="btn-primary">
            + New task
          </button>
        }
      />

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : tasks.length === 0 ? (
        <EmptyState
          title="No tasks yet"
          description="Break your work into tasks and move them across Backlog → This Week → Today → Done."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {TASK_COLUMNS.map((col) => (
            <div
              key={col.value}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(col.value)}
              className="flex flex-col rounded-2xl border border-border bg-surface-2/50 p-2.5"
            >
              <div className="mb-2 flex items-center justify-between px-1">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {col.label}
                </h2>
                <span className="rounded-full bg-surface px-1.5 py-0.5 text-xs text-muted">
                  {grouped[col.value].length}
                </span>
              </div>
              <div className="flex min-h-[40px] flex-1 flex-col gap-2">
                {grouped[col.value].map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    goal={t.relatedGoalId ? goalById[t.relatedGoalId] : undefined}
                    onEdit={startEdit}
                    onLogHours={(task) => {
                      setHoursModal(task);
                      setHoursToAdd("");
                    }}
                    onDragStart={(task) => setDragId(task.id)}
                  />
                ))}
              </div>
              <button
                onClick={() => startNew(col.value)}
                className="mt-2 rounded-lg px-2 py-1 text-left text-xs text-muted hover:bg-surface hover:text-fg"
              >
                + Add
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Task editor */}
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit task" : "New task"} wide>
        <form onSubmit={save} className="space-y-4">
          <Field label="Title">
            <TextInput
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              autoFocus
              required
              placeholder="e.g. Re-run flash count for P014"
            />
          </Field>
          <Field label="Description">
            <TextArea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className="min-h-[60px]"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Status">
              <Select
                options={TASK_COLUMNS}
                value={form.status}
                onChange={(e) => set("status", e.target.value as TaskStatus)}
              />
            </Field>
            <Field label="Priority">
              <Select
                options={PRIORITY_OPTIONS}
                value={form.priority}
                onChange={(e) => set("priority", e.target.value as Priority)}
              />
            </Field>
            <Field label="Due date">
              <TextInput
                type="date"
                value={form.dueDate}
                onChange={(e) => set("dueDate", e.target.value)}
              />
            </Field>
            <Field label="Hours spent">
              <TextInput
                type="number"
                min={0}
                step={0.5}
                value={form.hoursSpent || ""}
                onChange={(e) => set("hoursSpent", Number(e.target.value))}
              />
            </Field>
          </div>
          <Field label="Related goal">
            <Select
              options={[
                { value: "", label: "— None —" },
                ...goals.map((g) => ({ value: g.id, label: g.title })),
              ]}
              value={form.relatedGoalId}
              onChange={(e) => set("relatedGoalId", e.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Related files">
              <TextInput
                value={form.relatedFiles}
                onChange={(e) => set("relatedFiles", e.target.value)}
              />
            </Field>
            <Field label="Question for Cameron">
              <TextInput
                value={form.questionForCameron}
                onChange={(e) => set("questionForCameron", e.target.value)}
              />
            </Field>
          </div>
          <Field label="Notes">
            <TextArea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              className="min-h-[60px]"
            />
          </Field>
          <div className="flex items-center gap-2 pt-1">
            <button type="submit" className="btn-primary">
              {editing ? "Save changes" : "Create task"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost">
              Cancel
            </button>
            {editing && (
              <button
                type="button"
                onClick={() => {
                  if (confirm("Delete this task?")) {
                    remove(editing.id);
                    setOpen(false);
                  }
                }}
                className="btn-subtle ml-auto hover:text-rose-500"
              >
                Delete
              </button>
            )}
          </div>
        </form>
      </Modal>

      {/* Quick log-hours modal */}
      <Modal
        open={!!hoursModal}
        onClose={() => setHoursModal(null)}
        title={`Log hours · ${hoursModal?.title ?? ""}`}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Currently {fmtHours(hoursModal?.hoursSpent ?? 0)}h logged. Add time spent:
          </p>
          <Field label="Hours to add">
            <TextInput
              type="number"
              min={0}
              step={0.5}
              value={hoursToAdd}
              onChange={(e) => setHoursToAdd(e.target.value)}
              autoFocus
              placeholder="e.g. 1.5"
            />
          </Field>
          <div className="flex gap-2">
            <button onClick={saveHours} className="btn-primary">
              Add hours
            </button>
            <button onClick={() => setHoursModal(null)} className="btn-ghost">
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
