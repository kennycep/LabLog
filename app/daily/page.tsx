"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { DailyLogForm, type DailyLogInput } from "@/components/DailyLogForm";
import { LogCard } from "@/components/LogCard";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { dailyLogRepo } from "@/lib/repositories";
import { useCollection } from "@/lib/useCollection";
import { fmtHours, todayISO } from "@/lib/format";
import type { DailyLog } from "@/lib/types";

export default function DailyPage() {
  const { items, loading, create, update, remove } = useCollection(dailyLogRepo);
  const [editing, setEditing] = useState<DailyLog | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Logs are sorted by createdAt in the repo; re-sort by date for display.
  const logs = useMemo(
    () => [...items].sort((a, b) => b.date.localeCompare(a.date)),
    [items]
  );

  const todays = logs.find((l) => l.date === todayISO());

  async function handleCreate(data: DailyLogInput) {
    try {
      await create(data);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not save the log.");
    }
  }

  async function handleEditSave(data: DailyLogInput) {
    try {
      if (editing) await update(editing.id, data);
      setEditing(null);
      setModalOpen(false);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not save changes.");
    }
  }

  function handleDelete(log: DailyLog) {
    if (confirm(`Delete the log for ${log.date}?`)) remove(log.id);
  }

  return (
    <div>
      <PageHeader
        title="Daily Log"
        subtitle={
          todays
            ? "You've logged today — add more or review past days below."
            : "Capture today's work. It only takes a minute."
        }
      />

      {/* Quick-add form, always visible for speed */}
      <div className="card mb-8">
        <h2 className="mb-4 text-sm font-semibold">
          {todays ? "Add another entry" : "Log today"}
        </h2>
        <DailyLogForm onSubmit={handleCreate} />
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted">
          {logs.length} {logs.length === 1 ? "entry" : "entries"} ·{" "}
          {fmtHours(logs.reduce((s, l) => s + l.hours, 0))}h on task
        </h2>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : logs.length === 0 ? (
        <EmptyState
          title="No logs yet"
          description="Your daily entries will appear here. Start by logging today's work above."
        />
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <LogCard
              key={log.id}
              log={log}
              onEdit={(l) => {
                setEditing(l);
                setModalOpen(true);
              }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        title="Edit daily log"
        wide
      >
        {editing && (
          <DailyLogForm
            initial={editing}
            onSubmit={handleEditSave}
            onCancel={() => {
              setModalOpen(false);
              setEditing(null);
            }}
            submitLabel="Save changes"
          />
        )}
      </Modal>
    </div>
  );
}
