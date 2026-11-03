import type { RequestHandler } from "express";
import type { Room, User } from "../generated/prisma/client.js";
import { HttpError } from "../lib/http-error.js";
import { prisma } from "../lib/prisma.js";

declare global {
  namespace Express {
    interface Locals {
      user: User;
      room: Room;
      isOwner: boolean;
    }
  }
}

export const USER_TOKEN_HEADER = "x-user-token";

const ROOM_CODE = /^\d{5}$/;

// Guards /rooms/:code/*. The token is the only credential: no token (or one
// that matches no user) is 401, an unknown room is 404, and a valid user of a
// different room is 403. On success the user, room and isOwner are attached
// to `res.locals`.
export const requireRoomUser: RequestHandler<{ code: string }> = async (req, res, next) => {
  const token = req.get(USER_TOKEN_HEADER)?.trim();
  if (!token) throw new HttpError(401, "Missing user token");

  const user = await prisma.user.findUnique({ where: { token } });
  if (!user) throw new HttpError(401, "Invalid user token");

  const { code } = req.params;
  const room = ROOM_CODE.test(code) ? await prisma.room.findUnique({ where: { code } }) : null;
  if (!room) throw new HttpError(404, "Room not found");

  if (user.roomId !== room.id) throw new HttpError(403, "Not a member of this room");

  res.locals.user = user;
  res.locals.room = room;
  res.locals.isOwner = room.ownerId === user.id;
  next();
};

// Mount after requireRoomUser: only the room owner gets through.
export const requireOwner: RequestHandler = (_req, res, next) => {
  if (!res.locals.isOwner) throw new HttpError(403, "Only the room owner can do this");
  next();
};
