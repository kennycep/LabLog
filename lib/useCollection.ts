"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Repository } from "./storage";
import type { BaseRecord, ID } from "./types";

interface CollectionState<T extends BaseRecord> {
  items: T[];
  loading: boolean;
  create: (data: Omit<T, keyof BaseRecord>) => Promise<T>;
  update: (
    id: ID,
    patch: Partial<Omit<T, "id" | "createdAt">>
  ) => Promise<T | undefined>;
  remove: (id: ID) => Promise<void>;
  refresh: () => void;
}

// Subscribes a component to a repository. Re-reads on any local change so
// multiple pages / cards stay consistent without prop drilling.
export function useCollection<T extends BaseRecord>(
  repo: Repository<T>
): CollectionState<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const repoRef = useRef(repo);
  repoRef.current = repo;

  const refresh = useCallback(() => {
    repoRef.current.list().then((data) => {
      setItems(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    refresh();
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail || detail.key === repoRef.current.key) refresh();
    };
    const onStorage = () => refresh();
    window.addEventListener("lablog:change", onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("lablog:change", onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, [refresh]);

  const create = useCallback<CollectionState<T>["create"]>(async (data) => {
    const r = await repoRef.current.create(data);
    return r;
  }, []);

  const update = useCallback<CollectionState<T>["update"]>(
    async (id, patch) => repoRef.current.update(id, patch),
    []
  );

  const remove = useCallback<CollectionState<T>["remove"]>(
    async (id) => repoRef.current.remove(id),
    []
  );

  return { items, loading, create, update, remove, refresh };
}
