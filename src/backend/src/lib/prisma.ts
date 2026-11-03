import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

// Created at module scope so a warm Lambda container reuses the same client
// (and its connection) across invocations. The globalThis cache also keeps
// `tsx watch` reloads from opening a new pool each time.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 1 }),
  });

globalForPrisma.prisma = prisma;
