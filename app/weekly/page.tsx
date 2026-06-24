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
        title="Prepare Cameron update"
        subtitle="A meeting-prep document built from your notebook entries — accomplishments, time, blockers, and decisions needed. No filler."
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
