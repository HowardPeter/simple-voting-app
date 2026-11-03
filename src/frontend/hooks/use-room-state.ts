"use client";

import { useEffect, useState } from "react";
import { getRoom, type RoomState } from "@/lib/api";

const POLL_INTERVAL_MS = 3000;

type State = { code: string; room: RoomState | null; error: unknown };

// Polls GET /rooms/:code while `enabled`. The next poll is scheduled only
// after the previous one settles, so slow responses never overlap. Polling
// stops while the tab is hidden and fetches right away when it is shown again.
//
// A failed poll keeps the last good room and reports the error until the
// next successful poll. State is tagged with its code like useRoomSession.
export function useRoomState(code: string, enabled: boolean) {
  const [state, setState] = useState<State | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let inFlight = false;

    const poll = async () => {
      timer = undefined;
      inFlight = true;
      try {
        const room = await getRoom(code);
        if (!cancelled) setState({ code, room, error: null });
      } catch (error) {
        if (!cancelled) {
          setState((prev) => ({ code, room: prev?.code === code ? prev.room : null, error }));
        }
      }
      inFlight = false;
      if (!cancelled && !document.hidden) timer = setTimeout(poll, POLL_INTERVAL_MS);
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        clearTimeout(timer);
        timer = undefined;
      } else if (timer === undefined && !inFlight) {
        void poll();
      }
    };

    // In a hidden tab the first poll waits until the tab is shown.
    if (!document.hidden) void poll();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [code, enabled]);

  const current = state?.code === code ? state : null;
  return { room: current?.room ?? null, error: current?.error ?? null };
}
