"use client";

import Link from "next/link";
import { useMemo } from "react";
import { DashboardCard, StatCard } from "@/components/DashboardCard";
import { LogCard } from "@/components/LogCard";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import {
  blockerRepo,
  dailyLogRepo,
  fileIssueRepo,
  goalRepo,
  taskRepo,
} from "@/lib/repositories";
import { useCollection } from "@/lib/useCollection";
import {
  fmtHours,
  formatLongDate,
  inRange,
  startOfWeekISO,
  todayISO,
} from "@/lib/format";
import {
  GOAL_STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  URGENCY_OPTIONS,
  labelFor,
} from "@/lib/constants";

function lines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean);
}

export default function Dashboard() {
  const { items: logs, loading } = useCollection(dailyLogRepo);
  const { items: goals } = useCollection(goalRepo);
  const { items: tasks } = useCollection(taskRepo);
  const { items: blockers } = useCollection(blockerRepo);
  const { items: fileIssues } = useCollection(fileIssueRepo);

  const today = todayISO();
  const weekStart = startOfWeekISO();

  const sortedLogs = useMemo(
    () => [...logs].sort((a, b) => b.date.localeCompare(a.date)),
    [logs]
  );

  const todayLog = sortedLogs.find((l) => l.date === today);

  const weekLogs = useMemo(
    () => logs.filter((l) => inRange(l.date, weekStart, today)),
    [logs, weekStart, today]
  );
  const weekHours = weekLogs.reduce((s, l) => s + (l.hours || 0), 0);
  const weekLabHours = weekLogs.reduce((s, l) => s + (l.labHours || 0), 0);

  const openBlockers = blockers.filter((b) => b.status !== "resolved");
  const openFileIssues = fileIssues.filter((f) => !f.resolved);
  const activeGoals = goals.filter((g) => g.status !== "done");
  const todayTasks = tasks.filter((t) => t.status === "today");

  // Questions for Cameron: from recent logs + open blockers + tasks
  const questions = useMemo(() => {
    const fromLogs = weekLogs.flatMap((l) => lines(l.questions));
    const fromBlockers = openBlockers
      .filter((b) => b.needFromCameron.trim())
      .map((b) => b.needFromCameron.trim());
    const fromTasks = tasks
      .filter((t) => t.questionForCameron.trim())
      .map((t) => t.questionForCameron.trim());
    return Array.from(new Set([...fromLogs, ...fromBlockers, ...fromTasks]));
  }, [weekLogs, openBlockers, tasks]);

  const isEmpty = !loading && logs.length === 0 && goals.length === 0;

  if (isEmpty) {
    return (
      <div>
        <Welcome />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{formatLongDate(today)}</p>
          <h1 className="mt-0.5 text-2xl font-semibold tracking-tight">
            Research Command Center
          </h1>
        </div>
        <div className="flex gap-2">
          <Link href="/daily" className="btn-primary">
            + Log today
          </Link>
          <Link href="/weekly" className="btn-ghost">
            Generate weekly update
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="This week · on-task"
          value={`${fmtHours(weekHours)}h`}
          sub={`${weekLogs.length} day${weekLogs.length === 1 ? "" : "s"} logged`}
          accent
        />
        <StatCard label="This week · in lab" value={`${fmtHours(weekLabHours)}h`} />
        <StatCard
          label="Active blockers"
          value={String(openBlockers.length)}
          sub={openFileIssues.length ? `${openFileIssues.length} file issues` : undefined}
        />
        <StatCard label="Questions for Cameron" value={String(questions.length)} />
      </div>

      {/* Today's focus */}
      <div className="mb-6">
        <DashboardCard title="Today's focus" href="/daily">
          {todayLog ? (
            <div>
              <p className="text-base font-medium">
                {todayLog.focus || "Logged — no focus line set"}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
                <span>
                  {fmtHours(todayLog.hours)}h on task · {fmtHours(todayLog.labHours)}h in lab
                </span>
                {todayLog.tags.map((t) => (
                  <StatusBadge key={t} label={t} tone="accent" />
                ))}
              </div>
              {todayLog.nextSteps && (
                <p className="mt-3 text-sm text-muted">
                  <span className="font-medium text-fg">Next: </span>
                  {todayLog.nextSteps}
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted">
                You haven&apos;t logged today yet. Capture it while it&apos;s fresh.
              </p>
              <Link href="/daily" className="btn-primary">
                Log today
              </Link>
            </div>
          )}
          {todayTasks.length > 0 && (
            <div className="mt-4 border-t border-border pt-3">
              <p className="mb-2 text-xs font-medium text-muted">
                On the board for today
              </p>
              <ul className="space-y-1">
                {todayTasks.map((t) => (
                  <li key={t.id} className="flex items-center gap-2 text-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    {t.title}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </DashboardCard>
      </div>

      {/* Two-column grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent logs */}
        <DashboardCard
          title="Recent daily logs"
          href="/daily"
          count={logs.length}
          className="lg:row-span-2"
        >
          {sortedLogs.length === 0 ? (
            <EmptyState
              title="No logs yet"
              description="Start logging to build your weekly summary."
              actionLabel="Add a log"
              actionHref="/daily"
            />
          ) : (
            <div className="space-y-3">
              {sortedLogs.slice(0, 4).map((l) => (
                <LogCard key={l.id} log={l} compact />
              ))}
            </div>
          )}
        </DashboardCard>

        {/* Active blockers */}
        <DashboardCard title="Active blockers" href="/blockers" count={openBlockers.length}>
          {openBlockers.length === 0 ? (
            <p className="py-2 text-sm text-muted">Nothing blocking you right now. 🎉</p>
          ) : (
            <ul className="space-y-2">
              {openBlockers.slice(0, 4).map((b) => (
                <li key={b.id} className="flex items-start gap-2">
                  <StatusBadge
                    label={labelFor(URGENCY_OPTIONS, b.urgency)}
                    value={b.urgency}
                    className="mt-0.5 shrink-0"
                  />
                  <span className="text-sm">{b.title}</span>
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>

        {/* Questions for Cameron */}
        <DashboardCard title="Questions for Cameron" href="/blockers" count={questions.length}>
          {questions.length === 0 ? (
            <p className="py-2 text-sm text-muted">No open questions logged.</p>
          ) : (
            <ul className="space-y-2">
              {questions.slice(0, 5).map((q, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  {q}
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>
      </div>

      {/* Current goals */}
      <div className="mt-6">
        <DashboardCard title="Current goals" href="/goals" count={activeGoals.length}>
          {activeGoals.length === 0 ? (
            <p className="py-2 text-sm text-muted">
              No active goals.{" "}
              <Link href="/goals" className="text-accent hover:underline">
                Add one
              </Link>
              .
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {activeGoals.slice(0, 4).map((g) => (
                <div
                  key={g.id}
                  className="rounded-xl border border-border bg-surface-2/50 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-snug">{g.title}</p>
                    <StatusBadge
                      label={labelFor(GOAL_STATUS_OPTIONS, g.status)}
                      value={g.status}
                      className="shrink-0"
                    />
                  </div>
                  {g.nextMilestone && (
                    <p className="mt-1.5 text-xs text-muted">
                      <span className="font-medium">Next:</span> {g.nextMilestone}
                    </p>
                  )}
                  <div className="mt-1.5">
                    <StatusBadge
                      label={`${labelFor(PRIORITY_OPTIONS, g.priority)} priority`}
                      value={g.priority}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </DashboardCard>
      </div>
    </div>
  );
}

function Welcome() {
  const steps = [
    { href: "/daily", label: "Log today's work", desc: "Your first daily entry — focus, hours, blockers, next steps." },
    { href: "/goals", label: "Set a couple of goals", desc: "The longer arcs, like understanding the gaze coding workflow." },
    { href: "/tasks", label: "Add tasks to the board", desc: "Break work into cards and track hours per task." },
    { href: "/weekly", label: "Generate a weekly update", desc: "Turn your logs into a Slack message or email for Cameron." },
  ];
  return (
    <div className="mx-auto max-w-2xl py-6 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-2xl font-semibold text-white">
        L
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">Welcome to LabLog</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">
        Your personal research command center. Log what you do each day, track
        goals and blockers, and generate clean updates for Cameron and lab
        meetings — all stored locally in your browser.
      </p>
      <div className="mt-8 grid gap-3 text-left sm:grid-cols-2">
        {steps.map((s, i) => (
          <Link
            key={s.href}
            href={s.href}
            className="card transition hover:border-accent/40"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
                {i + 1}
              </span>
              <span className="font-medium">{s.label}</span>
            </div>
            <p className="mt-1.5 text-sm text-muted">{s.desc}</p>
          </Link>
        ))}
      </div>
      <Link href="/daily" className="btn-primary mt-8">
        Log your first day →
      </Link>
    </div>
  );
}
