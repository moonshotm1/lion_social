import type { PrismaClient } from "@lion/database";

export interface Context {
  prisma: PrismaClient;
  userId: string | null;
}

export type CreateContextOptions = {
  prisma: PrismaClient;
  userId: string | null;
};

export function createContext(opts: CreateContextOptions): Context {
  return {
    prisma: opts.prisma,
    userId: opts.userId,
  };
}
