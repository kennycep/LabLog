import { createRepository, STORE_KEYS } from "./storage";
import type { Blocker, DailyLog, FileIssue, Goal, Task } from "./types";

export const dailyLogRepo = createRepository<DailyLog>(STORE_KEYS.dailyLogs);
export const goalRepo = createRepository<Goal>(STORE_KEYS.goals);
export const taskRepo = createRepository<Task>(STORE_KEYS.tasks);
export const blockerRepo = createRepository<Blocker>(STORE_KEYS.blockers);
export const fileIssueRepo = createRepository<FileIssue>(STORE_KEYS.fileIssues);
