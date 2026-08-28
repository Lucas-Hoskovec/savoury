import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { AiGenerator, type AiHistoryItem } from "@/components/ai/ai-generator";

export const metadata: Metadata = {
  title: "Savoury AI · Savoury",
};

const RETENTION_DAYS = 30;

function retentionCutoff(): Date {
  return new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
}

export default async function AiPage() {
  const session = await getSession();
  if (!session.userId) redirect("/login");

  await prisma.aiRecipe.deleteMany({
    where: { userId: session.userId, createdAt: { lt: retentionCutoff() } },
  });

  const history = await prisma.aiRecipe.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 12,
    select: {
      id: true,
      prompt: true,
      title: true,
      ingredients: true,
      steps: true,
      prepTime: true,
      cookTime: true,
      servings: true,
      category: true,
      createdAt: true,
    },
  });

  const initialHistory: AiHistoryItem[] = history.map((h) => ({
    id: h.id,
    prompt: h.prompt,
    title: h.title,
    ingredients: h.ingredients,
    steps: h.steps,
    prepTime: h.prepTime,
    cookTime: h.cookTime,
    servings: h.servings,
    category: h.category,
    createdAt: h.createdAt.toISOString(),
  }));

  return <AiGenerator initialHistory={initialHistory} />;
}
