"use client";

import { PageHeader } from "@/components/PageHeader";
import { WeeklySummaryGenerator } from "@/components/WeeklySummaryGenerator";
import {
  blockerRepo,
  dailyLogRepo,
  fileIssueRepo,
  goalRepo,
  taskRepo,
} from "@/lib/repositories";
import { useCollection } from "@/lib/useCollection";

export default function WeeklyPage() {
  const { items: logs } = useCollection(dailyLogRepo);
  const { items: tasks } = useCollection(taskRepo);
  const { items: blockers } = useCollection(blockerRepo);
  const { items: goals } = useCollection(goalRepo);
  const { items: fileIssues } = useCollection(fileIssueRepo);

  return (
    <div>
      <PageHeader
        title="Weekly Summary"
        subtitle="Turn your daily logs into a clean update for Cameron and lab meeting — no filler, just your data."
      />
      <WeeklySummaryGenerator
        logs={logs}
        tasks={tasks}
        blockers={blockers}
        goals={goals}
        fileIssues={fileIssues}
      />
    </div>
  );
}
