"use client";

import { PageHeader } from "@/components/PageHeader";
import {
  WeeklySummaryGenerator,
  type SavedReportInput,
} from "@/components/WeeklySummaryGenerator";
import { CopyButton } from "@/components/CopyButton";
import { formatRange, relativeTime } from "@/lib/format";
import {
  blockerRepo,
  dailyLogRepo,
  fileIssueRepo,
  goalRepo,
  taskRepo,
  weeklyReportRepo,
} from "@/lib/repositories";
import { useCollection } from "@/lib/useCollection";

export default function WeeklyPage() {
  const { items: logs } = useCollection(dailyLogRepo);
  const { items: tasks } = useCollection(taskRepo);
  const { items: blockers } = useCollection(blockerRepo);
  const { items: goals } = useCollection(goalRepo);
  const { items: fileIssues } = useCollection(fileIssueRepo);
  const { items: reports, create: createReport, remove: removeReport } =
    useCollection(weeklyReportRepo);

  async function handleSave(r: SavedReportInput) {
    await createReport(r);
  }

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
        onSaveReport={handleSave}
      />

      {/* Meeting archive */}
      {reports.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold">Saved meeting reports</h2>
          <div className="space-y-3">
            {reports.map((r) => (
              <details key={r.id} className="panel p-4">
                <summary className="flex cursor-pointer list-none items-center gap-2">
                  <span className="text-sm font-medium">
                    {formatRange(r.startDate, r.endDate)}
                  </span>
                  <span className="text-xs text-muted">
                    saved {relativeTime(r.createdAt)}
                  </span>
                  <div className="ml-auto flex items-center gap-1.5">
                    <CopyButton
                      text={r.meetingNotes}
                      label="Copy agenda"
                      className="h-7 !px-2 text-xs"
                    />
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        if (confirm("Delete this saved report?"))
                          removeReport(r.id);
                      }}
                      className="rounded-md px-2 py-1 text-xs text-muted hover:text-rose-500"
                    >
                      Delete
                    </button>
                  </div>
                </summary>
                <pre className="scroll-thin mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-surface-2/50 p-3 font-sans text-sm leading-relaxed">
                  {r.meetingNotes}
                </pre>
              </details>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
