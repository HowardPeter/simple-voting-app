"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type CopyState = "idle" | "copied" | "failed";

const RESET_MS = 2000;

export function CopyCodeButton({ code }: { code: string }) {
  const [state, setState] = useState<CopyState>("idle");

  useEffect(() => {
    if (state === "idle") return;
    const timer = setTimeout(() => setState("idle"), RESET_MS);
    return () => clearTimeout(timer);
  }, [state]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setState("copied");
    } catch {
      setState("failed");
    }
  }

  return (
    <Button variant="secondary" onClick={copy} aria-label={`Copy room code ${code}`} className="h-9 px-3">
      <span aria-live="polite">
        {state === "copied" ? "Copied!" : state === "failed" ? "Copy failed" : "Copy"}
      </span>
    </Button>
  );
}
