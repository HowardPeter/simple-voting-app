import { CreateRoomForm } from "@/components/home/create-room-form";
import { JoinRoomForm } from "@/components/home/join-room-form";
import { RejoinRoom } from "@/components/home/rejoin-room";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Voting Demo</h1>
        <p className="text-muted">Create a room or join one with a code to start voting.</p>
      </header>
      <RejoinRoom />
      <div className="grid gap-6 md:grid-cols-2">
        <CreateRoomForm />
        <JoinRoomForm />
      </div>
    </main>
  );
}
