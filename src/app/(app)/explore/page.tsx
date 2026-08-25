import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getRankedRecipeIds } from "@/lib/feed";
import { CATEGORIES } from "@/lib/validation";
import { RecipeGridCard } from "@/components/feed/recipe-grid-card";
import { SearchInput } from "@/components/search-input";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ExplorePage(props: PageProps<"/explore">) {
  const searchParams = await props.searchParams;
  const category = typeof searchParams.category === "string" ? searchParams.category : null;
  const q = typeof searchParams.q === "string" ? searchParams.q.trim() : "";

  if (category && !(CATEGORIES as readonly string[]).includes(category)) {
    notFound();
  }

  const session = await getSession();
  const rankedIds = await getRankedRecipeIds({
    categoryId: category,
    q: q || null,
    excludeAuthorId: session.userId ?? null,
    limit: 60,
  });

  const rankedRecipes =
    rankedIds.length === 0
      ? []
      : await prisma.recipe.findMany({
          where: { id: { in: rankedIds } },
          select: {
            id: true,
            title: true,
            imageUrl: true,
            _count: { select: { likes: true, comments: true } },
          },
        });
  const orderMap = new Map(rankedIds.map((id, i) => [id, i]));
  const recipes = rankedRecipes.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));

  return (
    <div className="mx-auto max-w-[935px] px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold">Explorer</h1>
        <div className="w-full sm:w-72">
          <SearchInput
            placeholder="Rechercher des recettes…"
            action="/explore"
            defaultValue={q}
          />
        </div>
      </div>

      <div className="mb-6 mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Chip href="/explore" label="Tous" active={category === null} />
        {CATEGORIES.map((c) => (
          <Chip key={c} href={`/explore?category=${encodeURIComponent(c)}`} label={c} active={category === c} />
        ))}
      </div>

      {recipes.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">
          {q
            ? `Aucune recette trouvée pour « ${q} ».`
            : "Aucune recette dans cette catégorie pour le moment."}
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-1 sm:gap-2">
          {recipes.map((r) => (
            <RecipeGridCard
              key={r.id}
              recipe={{ ...r, likeCount: r._count.likes, commentCount: r._count.comments }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted"
      )}
    >
      {label}
    </Link>
  );
}