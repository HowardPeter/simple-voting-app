import { randomInt, randomUUID } from "node:crypto";
import { Router } from "express";
import { Prisma } from "../generated/prisma/client.js";
import { HttpError } from "../lib/http-error.js";
import { prisma } from "../lib/prisma.js";
import { serializeTopic, topicSelect } from "../lib/topics.js";
import { validateSchema } from "../lib/validate-schema.js";
import { requireRoomUser } from "../middleware/require-room-user.js";
import { roomBodySchema } from "../validator/rooms.js";
import { topicsRouter } from "./topics.js";

export const roomsRouter = Router();

const CODE_ATTEMPTS = 5;

const randomCode = () => randomInt(0, 100_000).toString().padStart(5, "0");

const isUniqueViolation = (err: unknown) =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";

// Create a room and its owner. The code is random, so on a unique conflict
// the whole transaction is retried with a fresh one.
roomsRouter.post("/", validateSchema(roomBodySchema), async (req, res) => {
  const { name } = req.body;

  for (let attempt = 1; ; attempt++) {
    try {
      const owner = await prisma.$transaction(async (tx) => {
        const room = await tx.room.create({ data: { code: randomCode() } });
        const user = await tx.user.create({
          data: { roomId: room.id, name, token: randomUUID() },
          include: { room: true },
        });
        await tx.room.update({ where: { id: room.id }, data: { ownerId: user.id } });
        return user;
      });

      res.status(201).json({
        code: owner.room.code,
        userId: owner.id,
        name: owner.name,
        token: owner.token,
      });
      return;
    } catch (err) {
      if (!isUniqueViolation(err) || attempt >= CODE_ATTEMPTS) throw err;
    }
  }
});

roomsRouter.post("/:code/join", validateSchema(roomBodySchema), async (req, res) => {
  const { name } = req.body;
  const room = await prisma.room.findUnique({ where: { code: req.params.code } });
  if (!room) throw new HttpError(404, "Room not found");

  const user = await prisma.user.create({
    data: { roomId: room.id, name, token: randomUUID() },
  });

  res.status(201).json({ code: room.code, userId: user.id, name: user.name, token: user.token });
});

// Everything below requires a session in the room. Create and join are
// matched above and never reach this.
roomsRouter.use("/:code", requireRoomUser);

// Full room state, polled by the frontend every few seconds, so it is a
// single query: participants, topics with per-option vote counts and the
// caller's own votes. Never returns tokens.
roomsRouter.get("/:code", async (_req, res) => {
  const { user, room } = res.locals;

  const state = await prisma.room.findUniqueOrThrow({
    where: { id: room.id },
    select: {
      code: true,
      ownerId: true,
      users: { select: { id: true, name: true }, orderBy: { createdAt: "asc" } },
      topics: { select: topicSelect(user.id), orderBy: { createdAt: "asc" } },
    },
  });

  res.json({
    code: state.code,
    participants: state.users.map((participant) => ({
      id: participant.id,
      name: participant.name,
      isOwner: participant.id === state.ownerId,
    })),
    topics: state.topics.map(serializeTopic),
  });
});

// Validate a stored session. Never returns the token.
roomsRouter.get("/:code/me", (_req, res) => {
  const { user, isOwner } = res.locals;
  res.json({ userId: user.id, name: user.name, isOwner });
});

roomsRouter.use("/:code/topics", topicsRouter);
