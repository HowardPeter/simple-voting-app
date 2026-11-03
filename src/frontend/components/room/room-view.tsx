"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useRoomSession } from "@/hooks/use-room-session";
import { useRoomState } from "@/hooks/use-room-state";
import { Button, buttonClassName } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ApiError } from "@/lib/api";
import { errorMessage, validateRoomCode } from "@/lib/validation";
import { CopyCodeButton } from "./copy-code-button";
import { JoinRoomPrompt } from "./join-room-prompt";
import { ParticipantList } from "./participant-list";
import { TopicList } from "./topic-list";

export function RoomView({ code }: { code: string }) {
  // A malformed code can never match a room, so skip the session check.
  if (validateRoomCode(code)) return <RoomNotFound />;
  return <ValidRoomView code={code} />;
}

function ValidRoomView({ code }: { code: string }) {
  const { status, session, error, join } = useRoomSession(code);
  const { room, error: pollError } = useRoomState(code, status === "joined");

  if (status === "loading") return <RoomLoading label="Checking your session…" />;
  if (status === "needs-join") {
    return (
      <Shell>
        <JoinRoomPrompt code={code} join={join} />
      </Shell>
    );
  }
  if (status === "room-not-found" || isNotFound(pollError)) return <RoomNotFound />;
  if (status === "error") return <RoomError message={errorMessage(error)} />;

  // Joined, waiting for the first poll.
  if (!room) {
    return pollError ? <RoomError message={errorMessage(pollError)} /> : <RoomLoading label="Loading room…" />;
  }

  return (
    <Shell wide>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted">Room code</span>
          <div className="flex items-center gap-3">
            <h1 className="font-mono text-3xl font-semibold tracking-widest">{room.code}</h1>
            <CopyCodeButton code={room.code} />
          </div>
        </div>
        {session && (
          <p className="text-sm text-muted">
            Signed in as <span className="font-medium text-foreground">{session.name}</span>
          </p>
        )}
      </header>
      {pollError !== null && (
        <p role="status" className="rounded-lg border border-danger/40 bg-danger/5 px-4 py-2 text-sm text-danger">
          Couldn&apos;t refresh the room. Retrying…
        </p>
      )}
      <div className="grid items-start gap-6 md:grid-cols-3">
        <ParticipantList participants={room.participants} currentUserId={session?.userId ?? null} />
        <TopicList topics={room.topics} className="md:col-span-2" />
      </div>
    </Shell>
  );
}

const isNotFound = (err: unknown) => err instanceof ApiError && err.status === 404;

function Shell({ wide = false, children }: { wide?: boolean; children: ReactNode }) {
  return (
    <main
      className={`mx-auto flex w-full flex-1 flex-col gap-6 px-4 py-10 sm:px-6 ${
        wide ? "max-w-5xl" : "max-w-md justify-center"
      }`}
    >
      <Link href="/" className="self-start text-sm text-muted transition-colors hover:text-foreground">
        ← Home
      </Link>
      {children}
    </main>
  );
}

export function RoomLoading({ label }: { label: string }) {
  return (
    <main className="flex flex-1 items-center justify-center gap-3 px-4 py-10 text-muted" role="status">
      <span aria-hidden className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      {label}
    </main>
  );
}

function RoomNotFound() {
  return (
    <Shell>
      <Card>
        <CardHeader title="Room not found" description="This room doesn't exist. Check the code and try again." />
        <Link href="/" className={buttonClassName()}>
          Back to home
        </Link>
      </Card>
    </Shell>
  );
}

function RoomError({ message }: { message: string }) {
  return (
    <Shell>
      <Card>
        <CardHeader title="Something went wrong" description={message} />
        <Button onClick={() => window.location.reload()}>Try again</Button>
      </Card>
    </Shell>
  );
}
