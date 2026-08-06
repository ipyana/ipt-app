"use client";

import { useState, useCallback } from "react";

export function useBulkSelection<T extends { id: number }>(items: T[]) {
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const toggleOne = useCallback((id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      const ids = items.map((i) => i.id);
      const allSelected = ids.length > 0 && ids.every((id) => prev.has(id));
      if (allSelected) {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      }
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
  }, [items]);

  const clear = useCallback(() => setSelected(new Set()), []);
  const remove = useCallback((ids: number[]) => {
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  }, []);

  const allSelected = items.length > 0 && items.every((i) => selected.has(i.id));
  const someSelected = selected.size > 0;

  return { selected, toggleOne, toggleAll, clear, remove, allSelected, someSelected };
}
