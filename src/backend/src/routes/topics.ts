import { Router } from "express";
import { HttpError } from "../lib/http-error.js";
import { prisma } from "../lib/prisma.js";
import { serializeTopic, topicSelect } from "../lib/topics.js";
import { validateSchema } from "../lib/validate-schema.js";
import { requireOwner } from "../middleware/require-room-user.js";
import { topicBodySchema, topicPatchSchema, voteBodySchema } from "../validator/rooms.js";

// Mounted under /rooms/:code/topics after requireRoomUser, so res.locals
// already holds the user and room. Topics are always looked up within that
// room: an id from another room is a 404.
export const topicsRouter = Router({ mergeParams: true });

topicsRouter.post("/", requireOwner, validateSchema(topicBodySchema), async (req, res) => {
  const { user, room } = res.locals;
  const { title, options } = req.body;

  const topic = await prisma.topic.create({
    data: {
      roomId: room.id,
      title,
      options: { create: options.map((label, position) => ({ label, position })) },
    },
    select: topicSelect(user.id),
  });

  res.status(201).json(serializeTopic(topic));
});

// Close a topic. Closing an already closed topic is a no-op.
topicsRouter.patch(
  "/:topicId",
  requireOwner,
  validateSchema(topicPatchSchema),
  async (req, res) => {
    const { user, room } = res.locals;
    const { topicId } = req.params;

    const { count } = await prisma.topic.updateMany({
      where: { id: topicId, roomId: room.id },
      data: { isOpen: false },
    });
    if (count === 0) throw new HttpError(404, "Topic not found");

    const topic = await prisma.topic.findUniqueOrThrow({
      where: { id: topicId },
      select: topicSelect(user.id),
    });
    res.json(serializeTopic(topic));
  },
);

// Cast or change the caller's vote. One vote per user per topic, enforced by
// the (topicId, userId) unique key the upsert targets.
topicsRouter.put("/:topicId/vote", validateSchema(voteBodySchema), async (req, res) => {
  const { user, room } = res.locals;
  const { topicId } = req.params;
  const { optionId } = req.body;

  const target = await prisma.topic.findFirst({
    where: { id: topicId, roomId: room.id },
    select: { isOpen: true, options: { where: { id: optionId }, select: { id: true } } },
  });
  if (!target) throw new HttpError(404, "Topic not found");
  if (!target.isOpen) throw new HttpError(409, "Topic is closed");
  if (target.options.length === 0) throw new HttpError(400, "optionId: not an option of this topic");

  await prisma.vote.upsert({
    where: { topicId_userId: { topicId, userId: user.id } },
    create: { topicId, userId: user.id, optionId },
    update: { optionId },
  });

  const topic = await prisma.topic.findUniqueOrThrow({
    where: { id: topicId },
    select: topicSelect(user.id),
  });
  res.json(serializeTopic(topic));
});
