import { getSupabase } from "./supabase";
import type { Repository } from "./storage";
import {
  createSupabaseRepository,
  emptyToNull,
  nstr,
  numOf,
  setIf,
  str,
  type TableMapper,
} from "./supabaseRepo";
import { calculateSessionHours } from "./time";
import type {
  Blocker,
  DailyLog,
  FileIssue,
  Goal,
  ISODate,
  Task,
  WeeklyReport,
  WorkSession,
} from "./types";

function arr(v: unknown): string[] {
  return Array.isArray(v) ? (v as string[]) : [];
}

// ---------------------------------------------------------------------------
// goals
// ---------------------------------------------------------------------------
const goalMapper: TableMapper<Goal> = {
  table: "goals",
  toRow(g) {
    const r: Record<string, unknown> = {};
    setIf(r, "title" in g, "title", g.title);
    setIf(r, "description" in g, "description", g.description);
    setIf(r, "status" in g, "status", g.status);
    setIf(r, "priority" in g, "priority", g.priority);
    setIf(r, "targetDate" in g, "target_date", emptyToNull(g.targetDate));
    setIf(r, "currentMilestone" in g, "current_milestone", g.currentMilestone);
    setIf(r, "nextMilestone" in g, "next_milestone", g.nextMilestone);
    setIf(r, "notes" in g, "notes", g.notes);
    return r;
  },
  fromRow(row) {
    return {
      id: str(row.id),
      createdAt: str(row.created_at),
      updatedAt: str(row.updated_at),
      title: nstr(row.title),
      description: nstr(row.description),
      status: (row.status as Goal["status"]) ?? "in_progress",
      priority: (row.priority as Goal["priority"]) ?? "medium",
      targetDate: (row.target_date as ISODate) ?? "",
      currentMilestone: nstr(row.current_milestone),
      nextMilestone: nstr(row.next_milestone),
      notes: nstr(row.notes),
    };
  },
};

// ---------------------------------------------------------------------------
// tasks
// ---------------------------------------------------------------------------
const taskMapper: TableMapper<Task> = {
  table: "tasks",
  toRow(t) {
    const r: Record<string, unknown> = {};
    setIf(r, "title" in t, "title", t.title);
    setIf(r, "description" in t, "description", t.description);
    setIf(r, "priority" in t, "priority", t.priority);
    setIf(r, "status" in t, "status", t.status);
    setIf(r, "relatedGoalId" in t, "related_goal_id", emptyToNull(t.relatedGoalId));
    setIf(r, "dueDate" in t, "due_date", emptyToNull(t.dueDate));
    setIf(r, "notes" in t, "notes", t.notes);
    setIf(r, "relatedFiles" in t, "related_files", t.relatedFiles);
    setIf(r, "questionForCameron" in t, "question_for_cameron", t.questionForCameron);
    setIf(r, "hoursSpent" in t, "hours_spent", t.hoursSpent);
    return r;
  },
  fromRow(row) {
    return {
      id: str(row.id),
      createdAt: str(row.created_at),
      updatedAt: str(row.updated_at),
      title: nstr(row.title),
      description: nstr(row.description),
      priority: (row.priority as Task["priority"]) ?? "medium",
      status: (row.status as Task["status"]) ?? "backlog",
      relatedGoalId: (row.related_goal_id as string) ?? "",
      dueDate: (row.due_date as ISODate) ?? "",
      notes: nstr(row.notes),
      relatedFiles: nstr(row.related_files),
      questionForCameron: nstr(row.question_for_cameron),
      hoursSpent: numOf(row.hours_spent),
    };
  },
};

// ---------------------------------------------------------------------------
// blockers
// ---------------------------------------------------------------------------
const blockerMapper: TableMapper<Blocker> = {
  table: "blockers",
  toRow(b) {
    const r: Record<string, unknown> = {};
    setIf(r, "title" in b, "title", b.title);
    setIf(r, "context" in b, "context", b.context);
    setIf(r, "tried" in b, "tried", b.tried);
    setIf(r, "needFromCameron" in b, "need_from_cameron", b.needFromCameron);
    setIf(r, "urgency" in b, "urgency", b.urgency);
    setIf(r, "relatedTaskId" in b, "related_task_id", emptyToNull(b.relatedTaskId));
    setIf(r, "status" in b, "status", b.status);
    return r;
  },
  fromRow(row) {
    return {
      id: str(row.id),
      createdAt: str(row.created_at),
      updatedAt: str(row.updated_at),
      title: nstr(row.title),
      context: nstr(row.context),
      tried: nstr(row.tried),
      needFromCameron: nstr(row.need_from_cameron),
      urgency: (row.urgency as Blocker["urgency"]) ?? "medium",
      relatedTaskId: (row.related_task_id as string) ?? "",
      status: (row.status as Blocker["status"]) ?? "open",
    };
  },
};

// ---------------------------------------------------------------------------
// file_issues
// ---------------------------------------------------------------------------
const fileIssueMapper: TableMapper<FileIssue> = {
  table: "file_issues",
  toRow(f) {
    const r: Record<string, unknown> = {};
    setIf(r, "project" in f, "project", f.project);
    setIf(r, "participantId" in f, "participant_id", f.participantId);
    setIf(r, "fileName" in f, "file_name", f.fileName);
    setIf(r, "issueType" in f, "issue_type", f.issueType);
    setIf(r, "status" in f, "status", f.status);
    setIf(r, "notes" in f, "notes", f.notes);
    setIf(r, "fixAttempted" in f, "fix_attempted", f.fixAttempted);
    setIf(r, "resolved" in f, "resolved", f.resolved);
    return r;
  },
  fromRow(row) {
    return {
      id: str(row.id),
      createdAt: str(row.created_at),
      updatedAt: str(row.updated_at),
      project: nstr(row.project),
      participantId: nstr(row.participant_id),
      fileName: nstr(row.file_name),
      issueType: (row.issue_type as FileIssue["issueType"]) ?? "needs_review",
      status: (row.status as FileIssue["status"]) ?? "open",
      notes: nstr(row.notes),
      fixAttempted: nstr(row.fix_attempted),
      resolved: row.resolved === true,
    };
  },
};

// ---------------------------------------------------------------------------
// weekly_reports
// ---------------------------------------------------------------------------
const weeklyReportMapper: TableMapper<WeeklyReport> = {
  table: "weekly_reports",
  toRow(w) {
    const r: Record<string, unknown> = {};
    setIf(r, "startDate" in w, "start_date", w.startDate);
    setIf(r, "endDate" in w, "end_date", w.endDate);
    setIf(r, "slackUpdate" in w, "slack_update", w.slackUpdate);
    setIf(r, "meetingNotes" in w, "meeting_notes", w.meetingNotes);
    setIf(r, "emailUpdate" in w, "email_update", w.emailUpdate);
    return r;
  },
  fromRow(row) {
    return {
      id: str(row.id),
      createdAt: str(row.created_at),
      updatedAt: str(row.created_at),
      startDate: str(row.start_date),
      endDate: str(row.end_date),
      slackUpdate: nstr(row.slack_update),
      meetingNotes: nstr(row.meeting_notes),
      emailUpdate: nstr(row.email_update),
    };
  },
};

export const goalRepo = createSupabaseRepository(goalMapper);
export const taskRepo = createSupabaseRepository(taskMapper);
export const blockerRepo = createSupabaseRepository(blockerMapper);
export const fileIssueRepo = createSupabaseRepository(fileIssueMapper);
export const weeklyReportRepo = createSupabaseRepository(weeklyReportMapper);

// ---------------------------------------------------------------------------
// daily_logs (+ nested work_sessions)
// ---------------------------------------------------------------------------
const DAILY_SELECT = "*, work_sessions(*)";

function dailyLogToRow(l: Partial<DailyLog>): Record<string, unknown> {
  const r: Record<string, unknown> = {};
  setIf(r, "date" in l, "date", l.date);
  setIf(r, "focus" in l, "focus", l.focus);
  setIf(r, "tags" in l, "tags", l.tags);
  setIf(r, "workedFor" in l, "worked_for", l.workedFor);
  setIf(r, "images" in l, "images", l.images);
  setIf(r, "did" in l, "did", l.did);
  setIf(r, "progress" in l, "progress", l.progress);
  setIf(r, "filesTouched" in l, "files_touched", l.filesTouched);
  setIf(r, "blockers" in l, "blockers", l.blockers);
  setIf(r, "tried" in l, "tried", l.tried);
  setIf(r, "questions" in l, "questions", l.questions);
  setIf(r, "nextSteps" in l, "next_steps", l.nextSteps);
  setIf(r, "confidence" in l, "confidence", l.confidence);
  setIf(r, "hoursOnTask" in l, "hours_on_task", l.hoursOnTask);
  setIf(
    r,
    "manualLabHoursOverride" in l,
    "manual_lab_hours_override",
    l.manualLabHoursOverride
  );
  return r;
}

function sessionFromRow(row: Record<string, unknown>): WorkSession {
  const s: WorkSession = {
    id: str(row.id),
    timeIn: nstr(row.time_in),
    timeOut: nstr(row.time_out),
    breakMinutes: numOf(row.break_minutes),
    sessionType: (row.session_type as WorkSession["sessionType"]) ?? "lab",
    overnight: row.overnight === true,
    notes: nstr(row.notes),
    calculatedHours: numOf(row.calculated_hours),
  };
  s.calculatedHours = calculateSessionHours(s);
  return s;
}

function sessionToRow(s: WorkSession, dailyLogId: string) {
  return {
    daily_log_id: dailyLogId,
    time_in: s.timeIn,
    time_out: s.timeOut,
    break_minutes: s.breakMinutes,
    session_type: s.sessionType,
    overnight: s.overnight,
    notes: s.notes,
    calculated_hours: calculateSessionHours(s),
  };
}

function dailyLogFromRow(row: Record<string, unknown>): DailyLog {
  const rawSessions = Array.isArray(row.work_sessions)
    ? (row.work_sessions as unknown as Record<string, unknown>[])
    : [];
  const sessions = rawSessions.map(sessionFromRow);
  sessions.sort((a, b) => (a.timeIn || "").localeCompare(b.timeIn || ""));
  return {
    id: str(row.id),
    createdAt: str(row.created_at),
    updatedAt: str(row.updated_at),
    date: str(row.date),
    sessions,
    hoursOnTask: numOf(row.hours_on_task),
    manualLabHoursOverride:
      row.manual_lab_hours_override == null
        ? null
        : numOf(row.manual_lab_hours_override),
    focus: nstr(row.focus),
    tags: arr(row.tags),
    workedFor: arr(row.worked_for),
    images: arr(row.images),
    did: nstr(row.did),
    progress: nstr(row.progress),
    filesTouched: nstr(row.files_touched),
    blockers: nstr(row.blockers),
    tried: nstr(row.tried),
    questions: nstr(row.questions),
    nextSteps: nstr(row.next_steps),
    confidence: (row.confidence as DailyLog["confidence"]) ?? "steady",
  };
}

async function replaceSessions(dailyLogId: string, sessions: WorkSession[]) {
  const sb = getSupabase();
  // Reconcile by replacing the set — simplest correct approach; session ids
  // aren't referenced anywhere else.
  const { error: delErr } = await sb
    .from("work_sessions")
    .delete()
    .eq("daily_log_id", dailyLogId);
  if (delErr) throw delErr;
  const rows = sessions
    .filter((s) => s.timeIn || s.timeOut || s.notes.trim())
    .map((s) => sessionToRow(s, dailyLogId));
  if (rows.length) {
    const { error: insErr } = await sb.from("work_sessions").insert(rows);
    if (insErr) throw insErr;
  }
}

export const dailyLogRepo: Repository<DailyLog> = {
  key: "daily_logs",
  async list() {
    const { data, error } = await getSupabase()
      .from("daily_logs")
      .select(DAILY_SELECT)
      .order("date", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r) => dailyLogFromRow(r as unknown as Record<string, unknown>));
  },
  async get(id) {
    const { data, error } = await getSupabase()
      .from("daily_logs")
      .select(DAILY_SELECT)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? dailyLogFromRow(data as unknown as Record<string, unknown>) : undefined;
  },
  async create(input) {
    const sb = getSupabase();
    const { data, error } = await sb
      .from("daily_logs")
      .insert(dailyLogToRow(input as Partial<DailyLog>))
      .select("id")
      .single();
    if (error) throw error;
    const id = (data as { id: string }).id;
    const sessions = (input as DailyLog).sessions ?? [];
    if (sessions.length) await replaceSessions(id, sessions);
    return (await this.get(id))!;
  },
  async update(id, patch) {
    const sb = getSupabase();
    const row = dailyLogToRow(patch as Partial<DailyLog>);
    if (Object.keys(row).length > 0) {
      const { error } = await sb.from("daily_logs").update(row).eq("id", id);
      if (error) throw error;
    }
    if ("sessions" in patch && patch.sessions) {
      await replaceSessions(id, patch.sessions as WorkSession[]);
    }
    return this.get(id);
  },
  async remove(id) {
    const { error } = await getSupabase()
      .from("daily_logs")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },
};
