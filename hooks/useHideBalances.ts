"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "nf-hide-balances";

export function useHideBalances() {
  const [hideBalances, setHideBalancesState] = useState(false);

  useEffect(() => {
    setHideBalancesState(localStorage.getItem(STORAGE_KEY) === "1");
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setHideBalancesState(e.newValue === "1");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setHideBalances = useCallback((v: boolean) => {
    setHideBalancesState(v);
    localStorage.setItem(STORAGE_KEY, v ? "1" : "0");
    // for same-tab listeners
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY, newValue: v ? "1" : "0" }));
  }, []);

  const toggle = useCallback(() => setHideBalances(!hideBalances), [hideBalances, setHideBalances]);

  return { hideBalances, setHideBalances, toggle };
}
