import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import { HttpError } from "./lib/http-error.js";
import { healthRouter } from "./routes/health.js";
import { roomsRouter } from "./routes/rooms.js";

// CORS_ORIGIN may list several origins separated by commas.
const corsOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const app = express();

app.disable("x-powered-by");
app.use(cors({ origin: corsOrigins }));
app.use(express.json());

app.use("/api/health", healthRouter);
app.use("/api/rooms", roomsRouter);

app.use(() => {
  throw new HttpError(404, "Not found");
});

// Every error leaves as `{ error: string }`. Client errors (HttpError, or
// body-parser errors such as malformed JSON, which carry `status` and
// `expose`) keep their message; anything else becomes a generic 500.
const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  const status = typeof err?.status === "number" ? err.status : 500;
  if (status >= 400 && status < 500 && err.expose) {
    res.status(status).json({ error: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "Internal server error" });
};

app.use(errorHandler);
