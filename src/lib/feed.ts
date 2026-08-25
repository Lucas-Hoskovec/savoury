import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { escapeLike } from "@/lib/sanitize";
import type { FeedItem, FeedPage } from "@/lib/feed-types";

type RecipeIdRow = { id: string };

const SCORE_ORDER = Prisma.sql`
  ORDER BY
    ((SELECT COUNT(*)::int FROM "Like" WHERE "Like"."recipeId" = "Recipe"."id")
     + "Recipe"."views"::float / 10.0)
     * POWER(0.85, EXTRACT(EPOCH FROM (NOW() - "Recipe"."createdAt")) / 86400.0 / 10) DESC,
    "Recipe"."createdAt" DESC
`;

const FOLLOWED_INTERVAL = 5;

function keywordCondition(q: string): Prisma.Sql {
  const like = `%${escapeLike(q)}%`;
  return Prisma.sql`(
    "title" ILIKE ${like}
    OR "description" ILIKE ${like}
    OR EXISTS (SELECT 1 FROM unnest("ingredients") AS ing WHERE ing ILIKE ${like})
  )`;
}

export async function getRankedRecipeIds(options: {
  categoryId?: string | null;
  q?: string | null;
  excludeAuthorId?: string | null;
  limit: number;
}): Promise<string[]> {
  const conditions: Prisma.Sql[] = [];
  if (options.categoryId) conditions.push(Prisma.sql`"category" = ${options.categoryId}`);
  if (options.excludeAuthorId) conditions.push(Prisma.sql`"authorId" <> ${options.excludeAuthorId}`);
  if (options.q) conditions.push(keywordCondition(options.q));

  const where = conditions.length > 0 ? Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}` : Prisma.empty;

  const rows = await prisma.$queryRaw<RecipeIdRow[]>(
    Prisma.sql`SELECT "id" FROM "Recipe" ${where} ${SCORE_ORDER} LIMIT ${options.limit}`
  );
  return rows.map((r) => r.id);
}

export async function getFeedPage(userId: string | undefined, offset: number, pageSize = 6): Promise<FeedPage> {
  let followedAuthorIds: string[] = [];
  if (userId) {
    const follows = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    followedAuthorIds = follows.map((f) => f.followingId);
  }

  let pageIds: string[];
  let hasMore: boolean;

  if (!userId || followedAuthorIds.length === 0) {
    const where = userId ? Prisma.sql`WHERE "authorId" <> ${userId}` : Prisma.empty;
    const rows = await prisma.$queryRaw<RecipeIdRow[]>(
      Prisma.sql`SELECT "id" FROM "Recipe" ${where} ${SCORE_ORDER} LIMIT ${pageSize + 1} OFFSET ${offset}`
    );
    hasMore = rows.length > pageSize;
    pageIds = (hasMore ? rows.slice(0, pageSize) : rows).map((r) => r.id);
  } else {
    const followedTotal = await prisma.recipe.count({
      where: { authorId: { in: followedAuthorIds } },
    });

    const popularWhere = Prisma.sql`WHERE "authorId" <> ${userId} AND "authorId" NOT IN (${Prisma.join(followedAuthorIds)})`;
    const popularTotalRows = await prisma.$queryRaw<Array<{ count: number }>>(
      Prisma.sql`SELECT COUNT(*)::int AS count FROM "Recipe" ${popularWhere}`
    );
    const popularTotal = Number(popularTotalRows[0]?.count ?? 0);

    type Target = { stream: "followed" | "popular"; v: number };

    const start = offset;
    const end = offset + pageSize;
    let position = 0;
    let compact = 0;
    let fi = 0;
    let pi = 0;
    const targets: Target[] = [];
    while (compact < end && (fi < followedTotal || pi < popularTotal)) {
      if (position % FOLLOWED_INTERVAL === FOLLOWED_INTERVAL - 1 && fi < followedTotal) {
        if (compact >= start) targets.push({ stream: "followed", v: fi });
        fi++;
        compact++;
      } else if (pi < popularTotal) {
        if (compact >= start) targets.push({ stream: "popular", v: pi });
        pi++;
        compact++;
      }
      position++;
    }

    const followedIdsPage = targets.filter((t) => t.stream === "followed");
    const popularIdsPage = targets.filter((t) => t.stream === "popular");
    const followedFrom = followedIdsPage.length > 0 ? followedIdsPage[0].v : 0;
    const followedTo = followedIdsPage.length > 0 ? followedIdsPage[followedIdsPage.length - 1].v : -1;
    const popularFrom = popularIdsPage.length > 0 ? popularIdsPage[0].v : 0;
    const popularTo = popularIdsPage.length > 0 ? popularIdsPage[popularIdsPage.length - 1].v : -1;

    const [followedRows, popularRows] = await Promise.all([
      followedIdsPage.length > 0
        ? prisma.recipe.findMany({
            where: { authorId: { in: followedAuthorIds } },
            orderBy: { createdAt: "desc" },
            select: { id: true },
            skip: followedFrom,
            take: followedTo - followedFrom + 1,
          })
        : Promise.resolve([] as Array<{ id: string }>),
      popularTo >= 0
        ? prisma.$queryRaw<RecipeIdRow[]>(
            Prisma.sql`SELECT "id" FROM "Recipe" ${popularWhere}
              ${SCORE_ORDER}
              LIMIT ${popularTo - popularFrom + 1} OFFSET ${popularFrom}`
          )
        : Promise.resolve([] as RecipeIdRow[]),
    ]);

    pageIds = targets.map((t) =>
      t.stream === "followed"
        ? followedRows[t.v - followedFrom]?.id
        : popularRows[t.v - popularFrom]?.id
    ).filter((id): id is string => Boolean(id));

    hasMore = fi < followedTotal || pi < popularTotal;
  }

  if (pageIds.length === 0) return { items: [], nextOffset: null };

  const recipes = await prisma.recipe.findMany({
    where: { id: { in: pageIds } },
    include: {
      author: { select: { username: true, avatarUrl: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });

  const orderMap = new Map(pageIds.map((id, i) => [id, i]));
  const pageRecipes = recipes.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));

  const likedSet = new Set<string>();
  const savedSet = new Set<string>();
  if (userId) {
    const likes = await prisma.like.findMany({
      where: { userId, recipeId: { in: pageIds } },
      select: { recipeId: true },
    });
    likes.forEach((l) => likedSet.add(l.recipeId));

    const saved = await prisma.savedRecipe.findMany({
      where: { userId, recipeId: { in: pageIds } },
      select: { recipeId: true },
    });
    saved.forEach((s) => savedSet.add(s.recipeId));
  }

  const items: FeedItem[] = pageRecipes.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    imageUrl: r.imageUrl,
    category: r.category,
    createdAt: r.createdAt.toISOString(),
    author: { username: r.author.username, avatarUrl: r.author.avatarUrl },
    likeCount: r._count.likes,
    commentCount: r._count.comments,
    liked: userId ? likedSet.has(r.id) : false,
    saved: userId ? savedSet.has(r.id) : false,
  }));

  return {
    items,
    nextOffset: hasMore ? offset + pageIds.length : null,
  };
}
