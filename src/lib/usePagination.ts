"use client";

import { useState, useMemo } from "react";

export const DEFAULT_PAGE_SIZES = [25, 50, 100, 200];

export function usePagination<T>(items: T[], initialPageSize = 25) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  const pageItems = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize]
  );

  function changePageSize(size: number) {
    setPageSize(size);
    setPage(1);
  }

  return {
    page: safePage,
    setPage,
    pageSize,
    changePageSize,
    total,
    totalPages,
    pageItems,
  };
}
