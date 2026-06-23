// localStorage-backed repository layer.
//
// Everything the UI needs goes through `createRepository`, which exposes an
// async-looking CRUD surface. When a backend (Supabase) is added later, only
// this file needs to change — swap the body of each method for a network call
// and keep the same signatures. Methods return promises already so callers
// don't need to change.

import type { BaseRecord, ID } from "./types";

const KEY_PREFIX = "lablog:";

function now(): string {
  return new Date().toISOString();
}

export function uid(): ID {
  // Stable enough for a single-user local app.
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  );
}

function read<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY_PREFIX + key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export class StorageQuotaError extends Error {
  constructor() {
    super(
      "Your browser's local storage is full — try removing some images or older logs."
    );
    this.name = "StorageQuotaError";
  }
}

function write<T>(key: string, value: T[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    // QuotaExceededError surfaces under various names across browsers.
    if (
      e instanceof DOMException &&
      (e.name === "QuotaExceededError" ||
        e.name === "NS_ERROR_DOM_QUOTA_REACHED")
    ) {
      throw new StorageQuotaError();
    }
    throw e;
  }
  // Notify same-tab subscribers (the native `storage` event only fires
  // across tabs). Repositories listen for this to refresh.
  window.dispatchEvent(new CustomEvent("lablog:change", { detail: { key } }));
}

export interface Repository<T extends BaseRecord> {
  key: string;
  list(): Promise<T[]>;
  get(id: ID): Promise<T | undefined>;
  create(data: Omit<T, keyof BaseRecord>): Promise<T>;
  update(id: ID, patch: Partial<Omit<T, "id" | "createdAt">>): Promise<T | undefined>;
  remove(id: ID): Promise<void>;
}

export function createRepository<T extends BaseRecord>(key: string): Repository<T> {
  return {
    key,
    async list() {
      return read<T>(key).sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt)
      );
    },
    async get(id) {
      return read<T>(key).find((r) => r.id === id);
    },
    async create(data) {
      const record = {
        ...(data as object),
        id: uid(),
        createdAt: now(),
        updatedAt: now(),
      } as T;
      const all = read<T>(key);
      all.push(record);
      write(key, all);
      return record;
    },
    async update(id, patch) {
      const all = read<T>(key);
      const idx = all.findIndex((r) => r.id === id);
      if (idx === -1) return undefined;
      const updated = { ...all[idx], ...patch, updatedAt: now() } as T;
      all[idx] = updated;
      write(key, all);
      return updated;
    },
    async remove(id) {
      const all = read<T>(key).filter((r) => r.id !== id);
      write(key, all);
    },
  };
}

// Concrete repositories — one per model.
export const STORE_KEYS = {
  dailyLogs: "daily-logs",
  goals: "goals",
  tasks: "tasks",
  blockers: "blockers",
  fileIssues: "file-issues",
} as const;
