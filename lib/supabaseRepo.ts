// Generic Supabase-backed repository. Keeps the same Repository<T> shape the
// UI already uses, so pages and the useCollection hook don't care that data now
// lives in Postgres instead of localStorage. RLS + `user_id default auth.uid()`
// handle ownership, so the client never sets user_id itself.

import { getSupabase } from "./supabase";
import type { Repository } from "./storage";
import type { BaseRecord, ID } from "./types";

export interface TableMapper<T extends BaseRecord> {
  table: string;
  select?: string;
  toRow(input: Partial<T>): Record<string, unknown>;
  fromRow(row: Record<string, unknown>): T;
}

export function createSupabaseRepository<T extends BaseRecord>(
  m: TableMapper<T>
): Repository<T> {
  const select = m.select ?? "*";
  return {
    key: m.table,
    async list() {
      const { data, error } = await getSupabase()
        .from(m.table)
        .select(select)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => m.fromRow(r as unknown as Record<string, unknown>));
    },
    async get(id: ID) {
      const { data, error } = await getSupabase()
        .from(m.table)
        .select(select)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data ? m.fromRow(data as unknown as Record<string, unknown>) : undefined;
    },
    async create(input) {
      const { data, error } = await getSupabase()
        .from(m.table)
        .insert(m.toRow(input as Partial<T>))
        .select(select)
        .single();
      if (error) throw error;
      return m.fromRow(data as unknown as Record<string, unknown>);
    },
    async update(id, patch) {
      const { data, error } = await getSupabase()
        .from(m.table)
        .update(m.toRow(patch as Partial<T>))
        .eq("id", id)
        .select(select)
        .single();
      if (error) throw error;
      return m.fromRow(data as unknown as Record<string, unknown>);
    },
    async remove(id) {
      const { error } = await getSupabase().from(m.table).delete().eq("id", id);
      if (error) throw error;
    },
  };
}

// --- small mapping helpers -------------------------------------------------

// Empty string → null (for nullable uuid / date columns).
export function emptyToNull(v: unknown): unknown {
  return v === "" || v === undefined ? null : v;
}
export function str(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}
export function nstr(v: unknown): string {
  // nullable text column → "" for the UI
  return v == null ? "" : String(v);
}
export function numOf(v: unknown): number {
  return typeof v === "number" ? v : v == null ? 0 : Number(v) || 0;
}

// Only assign a row key when the source field was actually provided, so partial
// updates (e.g. just { status }) don't blank out other columns.
export function setIf<T>(
  row: Record<string, unknown>,
  present: boolean,
  key: string,
  value: T
) {
  if (present) row[key] = value;
}
