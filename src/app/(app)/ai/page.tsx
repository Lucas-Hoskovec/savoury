import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 flex items-center gap-4 rounded-[1.75rem] border border-border/50 bg-card/60 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.07)] backdrop-blur-xl">
        <span className="grid size-14 shrink-0 place-items-center rounded-full bg-primary/10">
          <Sparkles className="size-7 text-primary" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Savoury AI</h1>
          <p className="text-sm text-muted-foreground">
            Décris une envie : le chef invente la recette.
          </p>
        </div>
      </div>
      <AiGenerator initialHistory={initialHistory} />
    </div>
  );
}
