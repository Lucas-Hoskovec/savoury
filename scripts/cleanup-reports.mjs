import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const cutoff = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

try {
  const { count } = await prisma.report.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });
  console.log(`Nettoyage RGPD : ${count} signalement(s) datant d'avant ${cutoff.toISOString()} supprimé(s).`);
} finally {
  await prisma.$disconnect();
}
