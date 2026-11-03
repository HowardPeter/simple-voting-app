import { configure } from "@codegenie/serverless-express";
import { app } from "./app.js";

// Lambda entry point. Env vars come from the function configuration, so
// dotenv is not loaded here. The handler only wraps the stateless `app`;
// all data lives in Postgres.
export const handler = configure({ app });
