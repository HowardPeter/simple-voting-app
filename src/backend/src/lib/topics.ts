import type { Prisma } from "../generated/prisma/client.js";

// What the API returns for a topic, loaded in the same query as the topic:
// options in display order with their vote counts (a COUNT subquery, not the
// vote rows) and only the viewer's own vote.
export const topicSelect = (userId: string) =>
  ({
    id: true,
    title: true,
    isOpen: true,
    createdAt: true,
    options: {
      select: { id: true, label: true, _count: { select: { votes: true } } },
      orderBy: { position: "asc" },
    },
    votes: { where: { userId }, select: { optionId: true } },
  }) satisfies Prisma.TopicSelect;

type SelectedTopic = Prisma.TopicGetPayload<{ select: ReturnType<typeof topicSelect> }>;

export const serializeTopic = (topic: SelectedTopic) => ({
  id: topic.id,
  title: topic.title,
  isOpen: topic.isOpen,
  createdAt: topic.createdAt,
  options: topic.options.map((option) => ({
    id: option.id,
    label: option.label,
    votes: option._count.votes,
  })),
  myOptionId: topic.votes[0]?.optionId ?? null,
});
