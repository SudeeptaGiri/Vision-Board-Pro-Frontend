import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['error', 'warn'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
};

export const prisma = global.prisma ?? prismaClientSingleton();

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;