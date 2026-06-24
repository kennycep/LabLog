"use client";

import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { GoalCard } from "@/components/GoalCard";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { Field, Select, TextArea, TextInput } from "@/components/Field";
import { Skeleton } from "@/components/Skeleton";
import { GOAL_STATUS_OPTIONS, PRIORITY_OPTIONS } from "@/lib/constants";
import { goalRepo } from "@/lib/repositories";
import { useCollection } from "@/lib/useCollection";
import type { Goal, GoalStatus, Priority } from "@/lib/types";

type GoalInput = Omit<Goal, "id" | "createdAt" | "updatedAt">;

const EMPTY: GoalInput = {
  title: "",
  description: "",
  status: "in_progress",
  priority: "medium",
  targetDate: "",
  currentMilestone: "",
  nextMilestone: "",
  notes: "",
};

export default function GoalsPage() {
  const { items, loading, create, update, remove } = useCollection(goalRepo);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [form, setForm] = useState<GoalInput>(EMPTY);

  function startNew() {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  }
  function startEdit(g: Goal) {
    setEditing(g);
    setForm(g);
    setOpen(true);
  }
  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (editing) update(editing.id, form);
    else create(form);
    setOpen(false);
  }
  function set<K extends keyof GoalInput>(k: K, v: GoalInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const active = items.filter((g) => g.status !== "done");
  const done = items.filter((g) => g.status === "done");

  return (
    <div>
      <PageHeader
        title="Goals"
        subtitle="Track the longer arcs of your lab work."
        action={
          <button onClick={startNew} className="btn-primary">
            + New goal
          </button>
        }
      />

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No goals yet"
          description="Add goals like “Understand manual gaze coding workflow” or “Adapt analysis from CounterCuing-02 to -01”. Use the New goal button above."
        />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-2">
            {active.map((g) => (
              <GoalCard key={g.id} goal={g} onEdit={startEdit} onDelete={(x) => remove(x.id)} />
            ))}
          </div>
          {done.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-muted">
                Completed ({done.length})
              </h2>
              <div className="grid gap-4 opacity-75 lg:grid-cols-2">
                {done.map((g) => (
                  <GoalCard key={g.id} goal={g} onEdit={startEdit} onDelete={(x) => remove(x.id)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit goal" : "New goal"} wide>
        <form onSubmit={save} className="space-y-4">
          <Field label="Goal title">
            <TextInput
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Understand manual gaze coding workflow"
              autoFocus
              required
            />
          </Field>
          <Field label="Description">
            <TextArea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className="min-h-[60px]"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="Status">
              <Select
                options={GOAL_STATUS_OPTIONS}
                value={form.status}
                onChange={(e) => set("status", e.target.value as GoalStatus)}
              />
            </Field>
            <Field label="Priority">
              <Select
                options={PRIORITY_OPTIONS}
                value={form.priority}
                onChange={(e) => set("priority", e.target.value as Priority)}
              />
            </Field>
            <Field label="Target date">
              <TextInput
                type="date"
                value={form.targetDate}
                onChange={(e) => set("targetDate", e.target.value)}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Current milestone">
              <TextInput
                value={form.currentMilestone}
                onChange={(e) => set("currentMilestone", e.target.value)}
              />
            </Field>
            <Field label="Next milestone">
              <TextInput
                value={form.nextMilestone}
                onChange={(e) => set("nextMilestone", e.target.value)}
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
          <div className="flex gap-2 pt-1">
            <button type="submit" className="btn-primary">
              {editing ? "Save changes" : "Create goal"}
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
