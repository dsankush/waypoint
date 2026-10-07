"use client";

import { useCallback, useEffect, useState } from "react";

/** A boolean remembered in localStorage (safe if storage is unavailable). */
export function useCollapsed(key: string) {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    try { setCollapsed(localStorage.getItem(key) === "1"); } catch { /* ignore */ }
  }, [key]);
  const toggle = useCallback(() => {
    setCollapsed((c) => {
      const n = !c;
      try { localStorage.setItem(key, n ? "1" : "0"); } catch { /* ignore */ }
      return n;
    });
  }, [key]);
  return [collapsed, toggle] as const;
}
