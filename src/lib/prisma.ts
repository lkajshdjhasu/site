import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

declare global {
  var prisma: ReturnType<typeof createPrismaClient> | undefined;
}

const createPrismaClient = () => {
  return new PrismaClient().$extends(withAccelerate());
};

const prisma = globalThis.prisma ?? createPrismaClient();

// Veritabanı bağlantısını test et
prisma
  .$connect()
  .then(() => {
    console.log("Database connected");
  })
  .catch((error) => {
    console.error("Database connection error:", error);
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

export { prisma };
