import { z } from "zod";

// Body of POST /rooms and POST /rooms/:code/join. The name is trimmed and its
// length counts code points, so an emoji counts as one character.
export const roomBodySchema = z.object({
  name: z
    .string({ error: "is required" })
    .trim()
    .refine((name) => {
      const length = [...name].length;
      return length >= 1 && length <= 30;
    }, "must be 1-30 characters"),
});

export type RoomBody = z.infer<typeof roomBodySchema>;

// Trimmed string whose length (in code points) is between 1 and `max`.
const label = (max: number) =>
  z
    .string({ error: "is required" })
    .trim()
    .refine((value) => {
      const length = [...value].length;
      return length >= 1 && length <= max;
    }, `must be 1-${max} characters`);

// Body of POST /rooms/:code/topics. Option labels must be distinct, ignoring
// case, so voters can tell them apart.
export const topicBodySchema = z.object({
  title: label(200),
  options: z
    .array(label(100), { error: "must be an array" })
    .min(2, "must have 2-10 options")
    .max(10, "must have 2-10 options")
    .refine(
      (options) => new Set(options.map((o) => o.toLowerCase())).size === options.length,
      "must be unique",
    ),
});

// Body of PATCH /rooms/:code/topics/:topicId. Closing is the only change.
export const topicPatchSchema = z.object({
  isOpen: z.literal(false, { error: "must be false" }),
});

// Body of PUT /rooms/:code/topics/:topicId/vote.
export const voteBodySchema = z.object({
  optionId: z.string({ error: "is required" }).min(1, "is required"),
});

export type TopicBody = z.infer<typeof topicBodySchema>;
export type VoteBody = z.infer<typeof voteBodySchema>;
