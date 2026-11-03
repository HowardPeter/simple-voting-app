import { Suspense } from "react";
import { RoomLoading, RoomView } from "@/components/room/room-view";

// The code is runtime data, so it is read inside Suspense and the loading
// state is the prerendered shell.
export default function RoomPage({ params }: PageProps<"/room/[code]">) {
  return (
    <Suspense fallback={<RoomLoading label="Checking your session…" />}>
      {params.then(({ code }) => (
        <RoomView code={code} />
      ))}
    </Suspense>
  );
}
