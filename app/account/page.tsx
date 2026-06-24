"use client";

import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/components/AuthProvider";
import { getSupabase } from "@/lib/supabase";
import {
  blockerRepo,
  dailyLogRepo,
  fileIssueRepo,
  goalRepo,
  taskRepo,
  weeklyReportRepo,
} from "@/lib/repositories";

const TABLES = [
  "daily_logs", // cascades work_sessions
  "tasks",
  "goals",
  "blockers",
  "file_issues",
  "weekly_reports",
];

export default function AccountPage() {
  const { user, signOut } = useAuth();
  const [busy, setBusy] = useState<"export" | "delete" | null>(null);
  const [msg, setMsg] = useState("");

  async function exportJson() {
    setBusy("export");
    setMsg("");
    try {
      const [dailyLogs, goals, tasks, blockers, fileIssues, weeklyReports] =
        await Promise.all([
          dailyLogRepo.list(),
          goalRepo.list(),
          taskRepo.list(),
          blockerRepo.list(),
          fileIssueRepo.list(),
          weeklyReportRepo.list(),
        ]);
      const payload = {
        exportedAt: new Date().toISOString(),
        account: user?.email,
        dailyLogs,
        goals,
        tasks,
        blockers,
        fileIssues,
        weeklyReports,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lablog-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Export failed.");
    } finally {
      setBusy(null);
    }
  }

  async function deleteAll() {
    const ok = confirm(
      "Delete ALL your LabLog data — logs, sessions, goals, tasks, blockers, file issues, and saved reports? This cannot be undone."
    );
    if (!ok) return;
    if (
      prompt('Type "DELETE" to confirm.')?.trim().toUpperCase() !== "DELETE"
    )
      return;

    setBusy("delete");
    setMsg("");
    try {
      const sb = getSupabase();
      for (const table of TABLES) {
        // RLS scopes this to the current user's rows only.
        const { error } = await sb
          .from(table)
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000");
        if (error) throw error;
      }
      setMsg("All your LabLog data has been deleted.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <PageHeader title="Account & data" subtitle="Manage your LabLog account." />

      <div className="space-y-6">
        {/* Profile */}
        <section className="panel p-5 sm:p-6">
          <h2 className="text-sm font-semibold">Profile</h2>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted">Signed in as</p>
              <p className="text-sm font-medium">{user?.email}</p>
            </div>
            <button onClick={() => signOut()} className="btn-ghost">
              Sign out
            </button>
          </div>
        </section>

        {/* Export */}
        <section className="panel p-5 sm:p-6">
          <h2 className="text-sm font-semibold">Export your data</h2>
          <p className="mt-1 text-sm text-muted">
            Download everything — logs, sessions, goals, tasks, blockers, file
            issues, and saved reports — as a single JSON file.
          </p>
          <button
            onClick={exportJson}
            disabled={busy !== null}
            className="btn-ghost mt-3"
          >
            {busy === "export" ? "Preparing…" : "Export as JSON"}
          </button>
        </section>

        {/* Danger zone */}
        <section className="panel border-rose-500/30 p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-rose-500">Danger zone</h2>
          <p className="mt-1 text-sm text-muted">
            Permanently delete all of your LabLog data. Your account stays, but
            every log and record is removed. This cannot be undone.
          </p>
          <button
            onClick={deleteAll}
            disabled={busy !== null}
            className="btn mt-3 border border-rose-500/40 bg-rose-500/10 text-rose-500 hover:bg-rose-500/15"
          >
            {busy === "delete" ? "Deleting…" : "Delete all my LabLog data"}
          </button>
        </section>

        {msg && <p className="text-sm text-muted">{msg}</p>}
      </div>
    </div>
  );
}
