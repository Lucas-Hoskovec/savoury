import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecipeGridCard } from "@/components/feed/recipe-grid-card";
import { UserAvatar } from "@/components/user-avatar";
import { formatCount } from "@/lib/format";

export const metadata: Metadata = {
  title: "Recherche · Savoury",
};

type RecipeSearchItem = {
  id: string;
  title: string;
  imageUrl: string;
  _count: { likes: number; comments: number };
};

type UserSearchItem = {
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  _count: { followers: number };
};

export default async function SearchPage(props: { searchParams: Promise<{ q?: string }> }) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === "string" ? searchParams.q.trim() : "";

  const session = await getSession();

  let recipes: RecipeSearchItem[] = [];
  let users: UserSearchItem[] = [];

  if (q) {
    const query = { contains: q, mode: "insensitive" as const };
    [recipes, users] = await Promise.all([
      prisma.recipe.findMany({
        where: {
          AND: [
            {
              OR: [{ title: query }, { description: query }, { ingredients: { has: q } }],
            },
            ...(session.userId ? [{ NOT: { authorId: session.userId } }] : []),
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 60,
        select: {
          id: true,
          title: true,
          imageUrl: true,
          _count: { select: { likes: true, comments: true } },
        },
      }),
      prisma.user.findMany({
        where: {
          OR: [{ username: query }, { bio: query }],
        },
        orderBy: { createdAt: "asc" },
        take: 30,
        select: {
          username: true,
          avatarUrl: true,
          bio: true,
          _count: { select: { followers: true } },
        },
      }),
    ]);
  }

  const noQuery = q.length === 0;
  const total = recipes.length + users.length;

  return (
    <div className="mx-auto max-w-[935px] px-4 py-6">
      <h1 className="font-display text-2xl font-bold">
        {noQuery ? "Recherche" : <>Résultats pour «&nbsp;{q}&nbsp;»</>}
      </h1>

      {noQuery ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <Search className="size-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Recherche une recette par titre, description ou ingrédient, ou un compte par son nom.
          </p>
        </div>
      ) : total === 0 ? (
        <p className="py-20 text-center text-muted-foreground">
          Aucun résultat pour «&nbsp;{q}&nbsp;».
        </p>
      ) : (
        <Tabs defaultValue="recipes" className="mt-6">
          <TabsList className="w-full justify-start rounded-full">
            <TabsTrigger value="recipes">Recettes ({recipes.length})</TabsTrigger>
            <TabsTrigger value="accounts">Comptes ({users.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="recipes" className="mt-6">
            {recipes.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">Aucune recette trouvée.</p>
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
          </TabsContent>

          <TabsContent value="accounts" className="mt-6">
            {users.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">Aucun compte trouvé.</p>
            ) : (
              <ul className="max-w-xl divide-y divide-border">
                {users.map((u) => (
                  <li key={u.username}>
                    <Link
                      href={`/users/${u.username}`}
                      className="flex items-center gap-3 rounded-md p-2.5 transition-colors hover:bg-muted"
                    >
                      <UserAvatar username={u.username} src={u.avatarUrl} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{u.username}</p>
                        {u.bio && <p className="truncate text-xs text-muted-foreground">{u.bio}</p>}
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatCount(u._count.followers)} abonné{u._count.followers > 1 ? "s" : ""}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}