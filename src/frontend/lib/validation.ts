import { ApiError } from "./api";

// Mirrors the backend's roomBodySchema: trimmed, 1-30 code points.
export const NAME_MAX = 30;

export function validateName(name: string): string | null {
  const length = [...name.trim()].length;
  if (length === 0) return "Enter your name.";
  if (length > NAME_MAX) return `Name must be at most ${NAME_MAX} characters.`;
  return null;
}

export function validateRoomCode(code: string): string | null {
  if (code.length === 0) return "Enter the room code.";
  if (!/^\d{5}$/.test(code)) return "Room code must be 5 digits.";
  return null;
}

// Backend errors carry their own message; anything else is a network failure.
export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  return "Could not reach the server. Check your connection and try again.";
}
