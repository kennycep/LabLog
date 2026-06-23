"use client";

import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { BlockerCard } from "@/components/BlockerCard";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { Field, Select, TextArea, TextInput } from "@/components/Field";
import { BLOCKER_STATUS_OPTIONS, URGENCY_OPTIONS } from "@/lib/constants";
import { blockerRepo, taskRepo } from "@/lib/repositories";
import { useCollection } from "@/lib/useCollection";
import type { Blocker, BlockerStatus, Urgency } from "@/lib/types";

type BlockerInput = Omit<Blocker, "id" | "createdAt" | "updatedAt">;

const EMPTY: BlockerInput = {
  title: "",
  context: "",
  tried: "",
  needFromCameron: "",
  urgency: "medium",
  relatedTaskId: "",
  status: "open",
};

const NEXT_STATUS: Record<BlockerStatus, BlockerStatus> = {
  open: "discussed",
  discussed: "resolved",
  resolved: "open",
};

export default function BlockersPage() {
  const { items, loading, create, update, remove } = useCollection(blockerRepo);
  const { items: tasks } = useCollection(taskRepo);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Blocker | null>(null);
  const [form, setForm] = useState<BlockerInput>(EMPTY);

  function startNew() {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  }
  function startEdit(b: Blocker) {
    setEditing(b);
    setForm(b);
    setOpen(true);
  }
  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (editing) update(editing.id, form);
    else create(form);
    setOpen(false);
  }
  function set<K extends keyof BlockerInput>(k: K, v: BlockerInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const openItems = items.filter((b) => b.status !== "resolved");
  const resolved = items.filter((b) => b.status === "resolved");

  return (
    <div>
      <PageHeader
        title="Blockers & Questions"
        subtitle="Everything you need help with — ready to bring to Cameron."
        action={
          <button onClick={startNew} className="btn-primary">
            + New blocker
          </button>
        }
      />

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : items.length === 0 ? (
        <EmptyState
          title="Nothing blocking you"
          description="When you hit an error or have a question for Cameron, capture it here so it doesn't get lost."
        />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-2">
            {openItems.map((b) => (
              <BlockerCard
                key={b.id}
                blocker={b}
                onEdit={startEdit}
                onDelete={(x) => remove(x.id)}
                onCycleStatus={(x) => update(x.id, { status: NEXT_STATUS[x.status] })}
              />
            ))}
          </div>
          {resolved.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-muted">
                Resolved ({resolved.length})
              </h2>
              <div className="grid gap-4 opacity-70 lg:grid-cols-2">
                {resolved.map((b) => (
                  <BlockerCard
                    key={b.id}
                    blocker={b}
                    onEdit={startEdit}
                    onDelete={(x) => remove(x.id)}
                    onCycleStatus={(x) => update(x.id, { status: NEXT_STATUS[x.status] })}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit blocker" : "New blocker"} wide>
        <form onSubmit={save} className="space-y-4">
          <Field label="Question / blocker title">
            <TextInput
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              autoFocus
              required
              placeholder="e.g. P014 flash count comes out empty"
            />
          </Field>
          <Field label="Context">
            <TextArea
              value={form.context}
              onChange={(e) => set("context", e.target.value)}
              placeholder="What's going on, where it happens…"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="What I tried">
              <TextArea
                value={form.tried}
                onChange={(e) => set("tried", e.target.value)}
              />
            </Field>
            <Field label="What I need from Cameron">
              <TextArea
                value={form.needFromCameron}
                onChange={(e) => set("needFromCameron", e.target.value)}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="Urgency">
              <Select
                options={URGENCY_OPTIONS}
                value={form.urgency}
                onChange={(e) => set("urgency", e.target.value as Urgency)}
              />
            </Field>
            <Field label="Status">
              <Select
                options={BLOCKER_STATUS_OPTIONS}
                value={form.status}
                onChange={(e) => set("status", e.target.value as BlockerStatus)}
              />
            </Field>
            <Field label="Related task">
              <Select
                options={[
                  { value: "", label: "— None —" },
                  ...tasks.map((t) => ({ value: t.id, label: t.title })),
                ]}
                value={form.relatedTaskId}
                onChange={(e) => set("relatedTaskId", e.target.value)}
              />
            </Field>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" className="btn-primary">
              {editing ? "Save changes" : "Create blocker"}
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
