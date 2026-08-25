import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { RecipeGridCard } from "@/components/feed/recipe-grid-card";

export const metadata: Metadata = { title: "Recettes enregistrées · Savoury" };

export default async function SavedPage() {
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const saved = await prisma.savedRecipe.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    include: {
      recipe: { include: { _count: { select: { likes: true, comments: true } } } },
    },
  });

  return (
    <div className="mx-auto max-w-[935px] px-4 py-6">
      <h1 className="font-display text-2xl font-bold">Recettes enregistrées</h1>
      {saved.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">
          Tu n&apos;as pas encore enregistré de recette.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-3 gap-1 sm:gap-2">
          {saved.map((s) => (
            <RecipeGridCard
              key={s.recipe.id}
              recipe={{
                id: s.recipe.id,
                title: s.recipe.title,
                imageUrl: s.recipe.imageUrl,
                likeCount: s.recipe._count.likes,
                commentCount: s.recipe._count.comments,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}