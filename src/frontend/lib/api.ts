import { getSession, saveSession } from "./session";

// Must be written literally so Next.js inlines it into the client bundle.
// A trailing slash is dropped so paths join cleanly.
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

// A non-2xx response. The message is the backend's `{ error }`. Network
// failures are not wrapped: they reject with fetch's own TypeError.
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type RoomCredentials = { code: string; userId: string; name: string; token: string };

export type Me = { userId: string; name: string; isOwner: boolean };

export type Participant = { id: string; name: string; isOwner: boolean };

export type TopicOption = { id: string; label: string; votes: number };

export type Topic = {
  id: string;
  title: string;
  isOpen: boolean;
  createdAt: string;
  options: TopicOption[];
  myOptionId: string | null;
};

export type RoomState = { code: string; participants: Participant[]; topics: Topic[] };

export type NewTopic = { title: string; options: string[] };

// `code` sends the stored session for that room as X-User-Token.
async function request<T>(
  method: string,
  path: string,
  opts: { code?: string; body?: unknown } = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (opts.code !== undefined) {
    const token = getSession(opts.code)?.token;
    if (token) headers["X-User-Token"] = token;
  }

  const res = await fetch(`${API_URL}/api${path}`, {
    method,
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });

  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      typeof data === "object" && data !== null && typeof (data as { error?: unknown }).error === "string"
        ? (data as { error: string }).error
        : res.statusText || `Request failed with status ${res.status}`;
    throw new ApiError(res.status, message);
  }
  return data as T;
}

const roomPath = (code: string) => `/rooms/${encodeURIComponent(code)}`;

const remember = (credentials: RoomCredentials) => {
  const { code, userId, name, token } = credentials;
  saveSession(code, { userId, name, token });
  return credentials;
};

export const getHealth = () => request<{ status: "ok" }>("GET", "/health");

export const createRoom = async (name: string) =>
  remember(await request<RoomCredentials>("POST", "/rooms", { body: { name } }));

export const joinRoom = async (code: string, name: string) =>
  remember(await request<RoomCredentials>("POST", `${roomPath(code)}/join`, { body: { name } }));

export const getMe = (code: string) => request<Me>("GET", `${roomPath(code)}/me`, { code });

export const getRoom = (code: string) => request<RoomState>("GET", roomPath(code), { code });

export const createTopic = (code: string, topic: NewTopic) =>
  request<Topic>("POST", `${roomPath(code)}/topics`, { code, body: topic });

export const closeTopic = (code: string, topicId: string) =>
  request<Topic>("PATCH", `${roomPath(code)}/topics/${encodeURIComponent(topicId)}`, {
    code,
    body: { isOpen: false },
  });

export const vote = (code: string, topicId: string, optionId: string) =>
  request<Topic>("PUT", `${roomPath(code)}/topics/${encodeURIComponent(topicId)}/vote`, {
    code,
    body: { optionId },
  });
