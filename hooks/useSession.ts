"use client";
import { useRef, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";

const SESSION_KEY = "bm_session_id";

export function useSession() {
  const sessionRef = useRef<string | null>(null);

  const getSession = useCallback((): string => {
    if (sessionRef.current) return sessionRef.current;
    if (typeof window === "undefined") return uuidv4();

    let sid = localStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = uuidv4();
      localStorage.setItem(SESSION_KEY, sid);
    }
    sessionRef.current = sid;
    return sid;
  }, []);

  return { getSession };
}
