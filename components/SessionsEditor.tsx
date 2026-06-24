"use client";

import { Select, TextInput } from "./Field";
import { SESSION_TYPE_OPTIONS } from "@/lib/constants";
import { fmtHours } from "@/lib/format";
import {
  calculateDailyLabHours,
  calculateSessionHours,
  newSession,
  nowHHMM,
} from "@/lib/time";
import type { SessionType, WorkSession } from "@/lib/types";

export function SessionsEditor({
  sessions,
  onChange,
}: {
  sessions: WorkSession[];
  onChange: (next: WorkSession[]) => void;
}) {
  function patch(id: string, changes: Partial<WorkSession>) {
    onChange(
      sessions.map((s) => {
        if (s.id !== id) return s;
        const merged = { ...s, ...changes };
        merged.calculatedHours = calculateSessionHours(merged);
        return merged;
      })
    );
  }

  function add() {
    // Pre-fill the new session's start with the previous one's end, or now.
    const last = sessions[sessions.length - 1];
    const timeIn = last?.timeOut || nowHHMM();
    onChange([...sessions, newSession({ timeIn })]);
  }

  function remove(id: string) {
    onChange(sessions.filter((s) => s.id !== id));
  }

  const total = calculateDailyLabHours(sessions, null);

  return (
    <div className="space-y-3">
      {sessions.map((s, i) => {
        const hrs = calculateSessionHours(s);
        const incomplete = (s.timeIn || s.timeOut) && hrs === 0;
        return (
          <div
            key={s.id}
            className="rounded-lg border border-border bg-surface-2/40 p-3"
          >
            <div className="mb-2.5 flex items-center gap-2">
              <span className="text-xs font-medium text-muted">
                Session {i + 1}
              </span>
              <span className="ml-auto text-xs font-semibold text-accent">
                {hrs > 0 ? `${fmtHours(hrs)} h` : "—"}
              </span>
              {sessions.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(s.id)}
                  className="rounded-md px-1.5 py-0.5 text-xs text-muted hover:text-rose-500"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <label className="block">
                <span className="mb-1 block text-[11px] font-medium text-muted">
                  Time in
                </span>
                <TextInput
                  type="time"
                  value={s.timeIn}
                  onChange={(e) => patch(s.id, { timeIn: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-medium text-muted">
                  Time out
                </span>
                <TextInput
                  type="time"
                  value={s.timeOut}
                  onChange={(e) => patch(s.id, { timeOut: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-medium text-muted">
                  Break (min)
                </span>
                <TextInput
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={5}
                  value={s.breakMinutes || ""}
                  onChange={(e) =>
                    patch(s.id, { breakMinutes: Number(e.target.value) })
                  }
                  placeholder="0"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-medium text-muted">
                  Type
                </span>
                <Select
                  options={SESSION_TYPE_OPTIONS}
                  value={s.sessionType}
                  onChange={(e) =>
                    patch(s.id, { sessionType: e.target.value as SessionType })
                  }
                />
              </label>
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2">
              <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted">
                <input
                  type="checkbox"
                  checked={s.overnight}
                  onChange={(e) => patch(s.id, { overnight: e.target.checked })}
                  className="h-3.5 w-3.5 rounded border-border accent-[rgb(var(--accent))]"
                />
                Ended after midnight
              </label>
              {incomplete && !s.overnight && (
                <span className="text-xs text-amber-500">
                  Time out is before time in — toggle “after midnight” if that’s
                  intended.
                </span>
              )}
            </div>

            <TextInput
              value={s.notes}
              onChange={(e) => patch(s.id, { notes: e.target.value })}
              placeholder="Session notes (optional) — e.g. coded P014–P016"
              className="mt-2.5"
            />
          </div>
        );
      })}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={add}
          className="text-sm font-medium text-accent hover:underline"
        >
          + Add another session
        </button>
        {sessions.length > 0 && (
          <span className="text-xs text-muted">
            Session total:{" "}
            <span className="font-semibold text-fg">{fmtHours(total)} h</span>
          </span>
        )}
      </div>
    </div>
  );
}
