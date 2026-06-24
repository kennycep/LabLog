"use client";

import Link from "next/link";
import { useMemo } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { Skeleton } from "@/components/Skeleton";
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
  formatDate,
  formatLongDate,
  inRange,
  startOfWeekISO,
  todayISO,
} from "@/lib/format";
import {
  calculateWeeklyFocusedHours,
  calculateWeeklyLabHours,
  dailyLabHours,
} from "@/lib/time";
import {
  GOAL_STATUS_OPTIONS,
  URGENCY_OPTIONS,
  labelFor,
} from "@/lib/constants";
import type { DailyLog } from "@/lib/types";

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
  const weekLab = calculateWeeklyLabHours(weekLogs);
  const weekFocused = calculateWeeklyFocusedHours(weekLogs);
  const daysLogged = new Set(weekLogs.map((l) => l.date)).size;
  const avgPerDay = daysLogged ? weekLab / daysLogged : 0;

  const openBlockers = blockers.filter((b) => b.status !== "resolved");
  const openFileIssues = fileIssues.filter((f) => !f.resolved);
  const activeGoals = goals.filter((g) => g.status !== "done");

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
  if (isEmpty) return <Welcome />;

  return (
    <div className="space-y-6">
      {/* Daily check-in band */}
      <section className="panel p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              {formatLongDate(today)}
            </p>
            {loading ? (
              <Skeleton className="mt-2 h-7 w-72" />
            ) : todayLog?.focus ? (
              <p className="mt-1.5 text-lg font-semibold leading-snug sm:text-xl">
                {todayLog.focus}
              </p>
            ) : (
              <p className="mt-1.5 text-lg font-semibold leading-snug text-muted sm:text-xl">
                What are you working on today?
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Link href="/daily" className="btn-primary h-9">
                {todayLog ? "Log another session" : "Log work session"}
              </Link>
              <Link href="/weekly" className="btn-ghost h-9">
                Prepare Cameron update
              </Link>
            </div>
          </div>

          {/* Week total, compact */}
          <div className="flex shrink-0 gap-6 border-t border-border pt-4 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
            <div>
              <p className="text-2xl font-semibold tracking-tight">
                {fmtHours(weekLab)}
                <span className="text-base font-normal text-muted">h</span>
              </p>
              <p className="text-xs text-muted">in lab this week</p>
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-tight">
                {fmtHours(weekFocused)}
                <span className="text-base font-normal text-muted">h</span>
              </p>
              <p className="text-xs text-muted">focused work</p>
            </div>
          </div>
        </div>

        {/* This week at a glance — inline metric strip */}
        <div className="mt-5 grid grid-cols-2 divide-border border-t border-border pt-4 sm:grid-cols-4 sm:divide-x">
          <Glance label="In lab" value={`${fmtHours(weekLab)} h`} />
          <Glance label="Focused work" value={`${fmtHours(weekFocused)} h`} />
          <Glance label="Days logged" value={String(daysLogged)} />
          <Glance label="Avg / day" value={`${fmtHours(avgPerDay)} h`} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Activity timeline */}
        <section className="panel p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent activity</h2>
            <Link href="/daily" className="text-xs font-medium text-accent hover:underline">
              Full record
            </Link>
          </div>
          {loading ? (
            <div className="space-y-5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-2.5 w-2.5 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="mt-2 h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : sortedLogs.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">
              No sessions logged yet — your activity timeline will build up here.
            </p>
          ) : (
            <Timeline logs={sortedLogs.slice(0, 6)} />
          )}
        </section>

        {/* Right rail: agenda + goals */}
        <div className="space-y-6">
          {/* Agenda */}
          <section className="panel p-5 sm:p-6">
            <h2 className="mb-3 text-sm font-semibold">
              Open questions & blockers
            </h2>
            {openBlockers.length === 0 && questions.length === 0 ? (
              <p className="py-2 text-sm text-muted">
                Nothing open right now. Note questions as they come up.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {openBlockers.slice(0, 4).map((b) => (
                  <li key={b.id} className="flex items-start gap-2.5">
                    <StatusBadge
                      label={labelFor(URGENCY_OPTIONS, b.urgency)}
                      value={b.urgency}
                      className="mt-0.5 shrink-0"
                    />
                    <span className="text-sm leading-snug">{b.title}</span>
                  </li>
                ))}
                {questions.slice(0, 4).map((q, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    <span className="text-sm leading-snug text-fg">{q}</span>
                  </li>
                ))}
              </ul>
            )}
            {openFileIssues.length > 0 && (
              <Link
                href="/files"
                className="mt-3 inline-block text-xs font-medium text-accent hover:underline"
              >
                {openFileIssues.length} open file issue
                {openFileIssues.length === 1 ? "" : "s"} →
              </Link>
            )}
          </section>

          {/* Goals progress */}
          <section className="panel p-5 sm:p-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Goals in progress</h2>
              <Link href="/goals" className="text-xs font-medium text-accent hover:underline">
                All goals
              </Link>
            </div>
            {activeGoals.length === 0 ? (
              <p className="py-2 text-sm text-muted">
                No active goals.{" "}
                <Link href="/goals" className="text-accent hover:underline">
                  Set one
                </Link>
                .
              </p>
            ) : (
              <ul className="space-y-3">
                {activeGoals.slice(0, 4).map((g) => (
                  <li key={g.id}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium leading-snug">
                        {g.title}
                      </span>
                      <StatusBadge
                        label={labelFor(GOAL_STATUS_OPTIONS, g.status)}
                        value={g.status}
                        className="shrink-0"
                      />
                    </div>
                    {g.nextMilestone && (
                      <p className="mt-1 text-xs text-muted">
                        Next: {g.nextMilestone}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Glance({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-1 first:pl-0 sm:px-4">
      <p className="text-xl font-semibold tracking-tight">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}

function Timeline({ logs }: { logs: DailyLog[] }) {
  return (
    <ol className="relative ml-1">
      <span className="absolute bottom-2 left-[3px] top-2 w-px bg-border" aria-hidden />
      {logs.map((log) => (
        <li key={log.id} className="relative flex gap-4 pb-5 last:pb-0">
          <span className="relative z-10 mt-1.5 h-[7px] w-[7px] shrink-0 rounded-full bg-accent ring-4 ring-surface" />
          <Link href="/daily" className="min-w-0 flex-1 group">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-medium text-muted">
                {formatDate(log.date)}
              </span>
              <span className="text-xs text-muted">
                {fmtHours(dailyLabHours(log))}h
                {log.hoursOnTask > 0 && ` · ${fmtHours(log.hoursOnTask)}h focused`}
              </span>
            </div>
            <p className="mt-0.5 text-sm font-medium leading-snug text-fg group-hover:text-accent">
              {log.focus || "Session logged"}
            </p>
            {(log.tags.length > 0 || log.workedFor.length > 0) && (
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted">
                {log.tags.slice(0, 3).map((t) => (
                  <span key={t} className="rounded bg-surface-2 px-1.5 py-0.5">
                    {t}
                  </span>
                ))}
                {log.workedFor.length > 0 && (
                  <span>for {log.workedFor.join(", ")}</span>
                )}
              </div>
            )}
          </Link>
        </li>
      ))}
    </ol>
  );
}

function Welcome() {
  const steps = [
    { href: "/daily", label: "Log a work session", desc: "Time in, time out, and what you worked on — your first notebook entry." },
    { href: "/goals", label: "Set a couple of goals", desc: "The longer arcs, like understanding the gaze coding workflow." },
    { href: "/tasks", label: "Add tasks to the board", desc: "Break work into cards and track hours per task." },
    { href: "/weekly", label: "Prepare a Cameron update", desc: "Turn your entries into a Slack message or meeting agenda." },
  ];
  return (
    <div className="mx-auto max-w-2xl py-6 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-2xl font-semibold text-white">
        L
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">Welcome to LabLog</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">
        Your lab notebook and work journal — log each session, track goals and
        blockers, and generate clean updates for Cameron and lab meetings. Stored
        locally in your browser.
      </p>
      <div className="mt-8 grid gap-3 text-left sm:grid-cols-2">
        {steps.map((s, i) => (
          <Link key={s.href} href={s.href} className="panel p-4 transition hover:border-accent/40">
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
        Log your first session →
      </Link>
    </div>
  );
}
