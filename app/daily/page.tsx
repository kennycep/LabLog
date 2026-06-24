"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { DailyLogForm, type DailyLogInput } from "@/components/DailyLogForm";
import { LogCard } from "@/components/LogCard";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonList } from "@/components/Skeleton";
import { Modal } from "@/components/Modal";
import { dailyLogRepo } from "@/lib/repositories";
import { useCollection } from "@/lib/useCollection";
import { fmtHours, formatLongDate, todayISO } from "@/lib/format";
import {
  calculateWeeklyFocusedHours,
  calculateWeeklyLabHours,
} from "@/lib/time";
import type { DailyLog } from "@/lib/types";

export default function DailyPage() {
  const { items, loading, create, update, remove } = useCollection(dailyLogRepo);
  const [editing, setEditing] = useState<DailyLog | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

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
    if (confirm(`Delete the entry for ${log.date}?`)) remove(log.id);
  }

  const totalLab = fmtHours(calculateWeeklyLabHours(logs));
  const totalFocused = fmtHours(calculateWeeklyFocusedHours(logs));

  return (
    <div>
      <PageHeader
        title="Daily Log"
        subtitle={`${formatLongDate(todayISO())} · your lab notebook`}
      />

      {/* Notebook entry — always visible for speed */}
      <div className="panel mb-8 p-5 sm:p-6">
        <h2 className="mb-5 text-sm font-semibold text-muted">
          {todays ? "New entry for today" : "Log today's work session"}
        </h2>
        <DailyLogForm onSubmit={handleCreate} submitLabel="Save entry" />
      </div>

      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">This week's lab record</h2>
        {logs.length > 0 && (
          <span className="text-xs text-muted">
            {logs.length} {logs.length === 1 ? "entry" : "entries"} ·{" "}
            {totalLab}h in lab · {totalFocused}h focused
          </span>
        )}
      </div>

      {loading ? (
        <SkeletonList rows={3} />
      ) : logs.length === 0 ? (
        <EmptyState
          title="No entries yet"
          description="Your daily lab notebook starts here — log today's session above and it'll appear in this record."
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
        title="Edit notebook entry"
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
