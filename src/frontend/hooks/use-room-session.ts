"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, getMe, joinRoom } from "@/lib/api";
import { clearSession, getSession, type Session } from "@/lib/session";

export type RoomSessionStatus = "loading" | "needs-join" | "joined" | "room-not-found" | "error";

type State = { code: string; status: RoomSessionStatus; session: Session | null; error: unknown };

// Restores the stored session for a room and validates it with GET /me.
// A rejected token (401/403) or a missing room (404) clears the stored
// session; any other failure (network, 5xx) is "error" and keeps it.
//
// State is tagged with the code it belongs to, so a new code reads as
// "loading" without a synchronous setState in the effect.
//
// A validation run is dropped when the effect is cleaned up (new code or
// unmount) or when join() bumps the generation, so a late GET /me result can
// neither overwrite state nor clear a session that join() just saved.
export function useRoomSession(code: string) {
  const [state, setState] = useState<State | null>(null);
  const generation = useRef(0);

  useEffect(() => {
    const run = ++generation.current;
    let cancelled = false;
    const isCurrent = () => !cancelled && generation.current === run;
    const settle = (status: RoomSessionStatus, session: Session | null = null, error: unknown = null) => {
      if (isCurrent()) setState({ code, status, session, error });
    };

    const validate = async () => {
      const session = getSession(code);
      if (!session) return settle("needs-join");

      try {
        await getMe(code);
        settle("joined", session);
      } catch (err) {
        if (!isCurrent()) return;
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          clearSession(code);
          settle("needs-join");
        } else if (err instanceof ApiError && err.status === 404) {
          clearSession(code);
          settle("room-not-found");
        } else {
          settle("error", session, err);
        }
      }
    };
    void validate();

    return () => {
      cancelled = true;
    };
  }, [code]);

  // Errors are rethrown so the caller's form can show them (e.g. a 400 name).
  const join = useCallback(
    async (name: string) => {
      generation.current++;
      try {
        const { userId, name: savedName, token } = await joinRoom(code, name);
        const session = { userId, name: savedName, token };
        setState({ code, status: "joined", session, error: null });
        return session;
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          setState({ code, status: "room-not-found", session: null, error: err });
        }
        throw err;
      }
    },
    [code],
  );

  const current = state?.code === code ? state : null;
  return {
    status: current?.status ?? "loading",
    session: current?.session ?? null,
    error: current?.error ?? null,
    join,
  };
}
