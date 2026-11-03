import type { RequestHandler } from "express";
import type { z } from "zod";
import { HttpError } from "./http-error.js";

// Reusable middleware: parses req.body with an endpoint's `z.object` schema
// and replaces it with the parsed (typed, transformed) value. The first issue
// becomes a 400 `{ error }`. A request with no JSON body is validated as `{}`
// so it reports the missing fields.
export function validateSchema<S extends z.ZodObject>(
  schema: S,
): RequestHandler<Record<string, string>, unknown, z.output<S>> {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) {
      const [issue] = result.error.issues;
      const path = issue.path.join(".");
      throw new HttpError(400, path ? `${path}: ${issue.message}` : issue.message);
    }
    req.body = result.data;
    next();
  };
}
