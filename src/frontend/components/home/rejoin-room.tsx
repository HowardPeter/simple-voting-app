"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { getLastRoom } from "@/lib/session";

// Re-read when another tab changes storage.
function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

// Storage is client-only, so the server (and hydration) render nothing.
export function RejoinRoom() {
  const code = useSyncExternalStore(subscribe, getLastRoom, () => null);
  if (!code) return null;

  return (
    <Link
      href={`/room/${code}`}
      className="flex items-center justify-between gap-4 rounded-xl border border-primary/40 bg-primary/5 px-5 py-4 transition-colors hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <span className="flex flex-col">
        <span className="text-sm text-muted">Pick up where you left off</span>
        <span className="font-medium">
          Rejoin room <span className="font-mono tracking-widest">{code}</span>
        </span>
      </span>
      <span aria-hidden className="text-xl text-primary">
        →
      </span>
    </Link>
  );
}
