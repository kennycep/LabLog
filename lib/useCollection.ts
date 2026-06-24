"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import type { Repository } from "./storage";
import type { BaseRecord, ID } from "./types";

interface CollectionState<T extends BaseRecord> {
  items: T[];
  loading: boolean;
  error: string | null;
  create: (data: Omit<T, keyof BaseRecord>) => Promise<T | undefined>;
  update: (
    id: ID,
    patch: Partial<Omit<T, "id" | "createdAt">>
  ) => Promise<T | undefined>;
  remove: (id: ID) => Promise<void>;
  refresh: () => Promise<void>;
}

// Subscribes a component to a Supabase-backed repository. Re-fetches whenever
// the signed-in user changes and after any mutation, so views stay consistent.
export function useCollection<T extends BaseRecord>(
  repo: Repository<T>
): CollectionState<T> {
  const { user } = useAuth();
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const repoRef = useRef(repo);
  repoRef.current = repo;

  const refresh = useCallback(async () => {
    try {
      const data = await repoRef.current.list();
      setItems(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    refresh();
  }, [user, refresh]);

  const create = useCallback<CollectionState<T>["create"]>(
    async (data) => {
      const r = await repoRef.current.create(data);
      await refresh();
      return r;
    },
    [refresh]
  );

  const update = useCallback<CollectionState<T>["update"]>(
    async (id, patch) => {
      const r = await repoRef.current.update(id, patch);
      await refresh();
      return r;
    },
    [refresh]
  );

  const remove = useCallback<CollectionState<T>["remove"]>(
    async (id) => {
      await repoRef.current.remove(id);
      await refresh();
    },
    [refresh]
  );

  return { items, loading, error, create, update, remove, refresh };
}
