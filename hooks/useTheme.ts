"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "nexus-flow-theme-cache";
type Theme = "dark" | "light";

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const cached = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
    const preferred = cached ?? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    setThemeState(preferred);
    document.documentElement.setAttribute("data-theme", preferred);
  }, []);

  const setTheme = useCallback((next: Theme | ((t: Theme) => Theme)) => {
    setThemeState((prev) => {
      const resolved = typeof next === "function" ? next(prev) : next;
      window.localStorage.setItem(STORAGE_KEY, resolved);
      document.documentElement.setAttribute("data-theme", resolved);
      return resolved;
    });
  }, []);

  return { theme, setTheme };
}
