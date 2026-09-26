import { PrismaClient } from '@prisma/client';
import { mockDb } from './mock-db';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getPrismaInstance(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL;
  if (
    process.env.NODE_ENV === 'test' ||
    !dbUrl ||
    dbUrl.includes('[password]') ||
    dbUrl.includes('your_supabase_project_url')
  ) {
    return mockDb as unknown as PrismaClient;
  }
  return new PrismaClient({
    log: ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? getPrismaInstance();

globalForPrisma.prisma = prisma;

