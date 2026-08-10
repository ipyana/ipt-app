"use client";

import { useCallback, useEffect, useState } from "react";
import { WindowType } from "@/lib/windows";

interface WindowStatus {
  type: WindowType;
  enabled: boolean;
  open: boolean;
  startAt: string | null;
  endAt: string | null;
  message: string;
}

/**
 * Fetches the current window status for a student action type.
 * Returns `loading` until the fetch settles and `check()` to re-check.
 */
export function useWindowStatus(type: WindowType) {
  const [status, setStatus] = useState<WindowStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const check = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/windows?type=${type}`);
      const data = await res.json();
      setStatus(data.open === undefined ? null : data);
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => { check(); }, [check]);

  const open = status === null ? true : status.open;

  return { status, loading, open, check };
}
