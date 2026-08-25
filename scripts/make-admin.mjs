import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const username = process.argv[2];

if (!username) {
  console.error("Usage : npm run db:make-admin -- <username>");
  process.exit(1);
}

try {
  const user = await prisma.user.update({
    where: { username },
    data: { role: "ADMIN" },
  });
  console.log(`${user.username} est maintenant administrateur.`);
} catch {
  console.error(`Utilisateur "${username}" introuvable.`);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
