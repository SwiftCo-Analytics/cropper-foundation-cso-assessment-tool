import { PrismaClient } from '../generated/prisma';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function getAssessment(id: string) {
  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: {
      organization: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!assessment) {
    throw new Error("Assessment not found");
  }

  return assessment;
} 