"use client";

import { useMemo, useState } from "react";
import { CopyButton } from "./CopyButton";
import { StatCard } from "./DashboardCard";
import { TextInput } from "./Field";
import { fmtHours, isoDaysAgo, startOfWeekISO, todayISO } from "@/lib/format";
import {
  buildSummaryData,
  generateBlockerList,
  generateEmail,
  generateNextWeekPlan,
  generateSlack,
  generateTalkingPoints,
  type SummaryInput,
} from "@/lib/summary";
import type { Blocker, DailyLog, FileIssue, Goal, Task } from "@/lib/types";

type Tab = "slack" | "talking" | "email" | "blockers" | "next";

const TABS: { value: Tab; label: string }[] = [
  { value: "talking", label: "Talking points" },
  { value: "slack", label: "Slack update" },
  { value: "email", label: "Email" },
  { value: "blockers", label: "Blockers / Qs" },
  { value: "next", label: "Next week" },
];

export function WeeklySummaryGenerator({
  logs,
  tasks,
  blockers,
  goals,
  fileIssues,
}: {
  logs: DailyLog[];
  tasks: Task[];
  blockers: Blocker[];
  goals: Goal[];
  fileIssues: FileIssue[];
}) {
  const [start, setStart] = useState(startOfWeekISO());
  const [end, setEnd] = useState(todayISO());
  const [tab, setTab] = useState<Tab>("talking");

  const input: SummaryInput = useMemo(
    () => ({ start, end, logs, tasks, blockers, goals, fileIssues }),
    [start, end, logs, tasks, blockers, goals, fileIssues]
  );

  const data = useMemo(() => buildSummaryData(input), [input]);

  const outputs: Record<Tab, string> = useMemo(
    () => ({
      slack: generateSlack(data),
      talking: generateTalkingPoints(data),
      email: generateEmail(data),
      blockers: generateBlockerList(data),
      next: generateNextWeekPlan(data),
    }),
    [data]
  );

  const hasData = data.logs.length > 0;

  function quickRange(days: number) {
    setStart(isoDaysAgo(days - 1));
    setEnd(todayISO());
  }

  return (
    <div className="space-y-6">
      {/* Range controls */}
      <div className="card">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="label">From</label>
            <TextInput
              type="date"
              value={start}
              max={end}
              onChange={(e) => setStart(e.target.value)}
              className="w-auto"
            />
          </div>
          <div>
            <label className="label">To</label>
            <TextInput
              type="date"
              value={end}
              min={start}
              onChange={(e) => setEnd(e.target.value)}
              className="w-auto"
            />
          </div>
          <div className="flex gap-1.5">
            <button onClick={() => quickRange(7)} className="btn-ghost h-9">
              This week
            </button>
            <button onClick={() => quickRange(14)} className="btn-ghost h-9">
              Last 14d
            </button>
            <button
              onClick={() => {
                setStart(startOfWeekISO());
                setEnd(todayISO());
              }}
              className="btn-ghost h-9"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Snapshot */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="On-task hours"
          value={`${fmtHours(data.totalHours)}h`}
          sub={`${data.logs.length} day${data.logs.length === 1 ? "" : "s"} logged`}
          accent
        />
        <StatCard label="Lab hours" value={`${fmtHours(data.totalLabHours)}h`} />
        <StatCard
          label="Blockers / Qs"
          value={String(data.blockerPoints.length + data.questionPoints.length)}
        />
        <StatCard label="Open file issues" value={String(data.openFileIssues.length)} />
      </div>

      {!hasData ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface/50 px-6 py-10 text-center">
          <p className="text-sm font-medium text-fg">No logs in this range</p>
          <p className="mt-1 text-sm text-muted">
            Pick a range that includes some daily logs, or add logs first. The
            summary is built entirely from what you&apos;ve recorded.
          </p>
        </div>
      ) : (
        <div className="card">
          {/* Tabs */}
          <div className="mb-4 flex flex-wrap gap-1 border-b border-border pb-3">
            {TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={
                  tab === t.value
                    ? "rounded-lg bg-accent-soft px-3 py-1.5 text-sm font-medium text-accent"
                    : "rounded-lg px-3 py-1.5 text-sm font-medium text-muted hover:bg-surface-2 hover:text-fg"
                }
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs text-muted">
              Generated from your logs · {data.range.label}
            </p>
            <CopyButton text={outputs[tab]} className="h-8" />
          </div>

          <pre className="scroll-thin max-h-[460px] overflow-auto whitespace-pre-wrap rounded-xl border border-border bg-surface-2/60 p-4 font-sans text-sm leading-relaxed text-fg">
            {outputs[tab]}
          </pre>
        </div>
      )}
    </div>
  );
}
