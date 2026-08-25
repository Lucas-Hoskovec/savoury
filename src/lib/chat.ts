import { prisma } from "@/lib/prisma";

export function normalizePair(a: string, b: string) {
  return a < b ? { userAId: a, userBId: b } : { userAId: b, userBId: a };
}

export async function findConversation(userAId: string, userBId: string) {
  return prisma.conversation.findFirst({
    where: {
      OR: [
        { userAId, userBId },
        { userAId: userBId, userBId: userAId },
      ],
    },
  });
}