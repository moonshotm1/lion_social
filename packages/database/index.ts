import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Guard: only create PrismaClient when DATABASE_URL is available
export const prisma = process.env.DATABASE_URL
  ? (globalForPrisma.prisma ?? new PrismaClient())
  : (null as unknown as PrismaClient);

if (process.env.DATABASE_URL && process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export * from "@prisma/client";
export type { PrismaClient } from "@prisma/client";
