"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type SessionState = "loading" | "in" | "out";

/** Sessão do Supabase com live-update (login/logout refletem na hora). */
export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>("loading");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setState(data.session ? "in" : "out");
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(session ? "in" : "out");
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}
