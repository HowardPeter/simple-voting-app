import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// The CLI (migrate, introspect) connects through the session-mode pooler.
// Runtime queries use DATABASE_URL via the driver adapter in src/lib/prisma.ts.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});
