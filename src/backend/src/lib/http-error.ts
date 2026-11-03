// Throw from a route (sync or async — Express 5 forwards rejected promises)
// to send `{ error: message }` with the given status via the central handler.
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}
