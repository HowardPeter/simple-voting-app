// Per-room sessions in localStorage. Client-side only: every function is a
// no-op (or returns null) during server rendering, and storage errors (private
// mode, quota) are swallowed so a session still works in memory for the tab.

export type Session = { userId: string; name: string; token: string };

const LAST_ROOM_KEY = "voting:lastRoom";
const ROOM_CODE = /^\d{5}$/;

const sessionKey = (code: string) => `voting:session:${code}`;

function read(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {}
}

function remove(key: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {}
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

function parseSession(raw: string): Session | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) return null;
    const { userId, name, token } = value as Record<string, unknown>;
    if (!isNonEmptyString(userId) || !isNonEmptyString(name) || !isNonEmptyString(token)) {
      return null;
    }
    return { userId, name, token };
  } catch {
    return null;
  }
}

// A corrupted entry is removed so it is not read again.
export function getSession(code: string): Session | null {
  const key = sessionKey(code);
  const raw = read(key);
  if (raw === null) return null;

  const session = parseSession(raw);
  if (!session) remove(key);
  return session;
}

export function saveSession(code: string, session: Session) {
  const { userId, name, token } = session;
  write(sessionKey(code), JSON.stringify({ userId, name, token }));
  write(LAST_ROOM_KEY, code);
}

export function clearSession(code: string) {
  remove(sessionKey(code));
  if (read(LAST_ROOM_KEY) === code) remove(LAST_ROOM_KEY);
}

export function getLastRoom(): string | null {
  const code = read(LAST_ROOM_KEY);
  if (code === null) return null;
  if (!ROOM_CODE.test(code)) {
    remove(LAST_ROOM_KEY);
    return null;
  }
  return code;
}
