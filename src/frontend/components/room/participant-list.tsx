import { Card, CardHeader } from "@/components/ui/card";
import type { Participant } from "@/lib/api";

type Props = { participants: Participant[]; currentUserId: string | null };

export function ParticipantList({ participants, currentUserId }: Props) {
  return (
    <Card>
      <CardHeader title={`Participants (${participants.length})`} />
      <ul className="flex flex-col gap-2">
        {participants.map((participant) => (
          <li key={participant.id} className="flex min-w-0 items-center gap-2 text-sm">
            <span className="truncate">{participant.name}</span>
            {participant.id === currentUserId && <span className="shrink-0 text-muted">(you)</span>}
            {participant.isOwner && (
              <span className="ml-auto shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                Owner
              </span>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
