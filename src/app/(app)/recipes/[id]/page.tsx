import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Clock, Users, Flame } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/components/user-avatar";
import { FollowButton } from "@/components/follow-button";
import { RecipeLikeButton } from "@/components/recipe/recipe-like-button";
import { SaveButton } from "@/components/feed/save-button";
import { ShareButton } from "@/components/recipe/share-button";
import { ViewTracker } from "@/components/recipe/view-tracker";
import { DeleteRecipeButton } from "@/components/recipe/delete-recipe-button";
import { CommentSection } from "@/components/recipe/comment-section";
import { ReportDialog } from "@/components/moderation/report-dialog";
import { timeAgo } from "@/lib/format";

export async function generateMetadata(props: PageProps<"/recipes/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const recipe = await prisma.recipe.findUnique({ where: { id }, select: { title: true } });
  return { title: recipe?.title ?? "Recette" };
}

export default async function RecipePage(props: PageProps<"/recipes/[id]">) {
  const { id } = await props.params;
  const session = await getSession();
  const userId = session.userId;

  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, username: true, avatarUrl: true, bio: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });

  if (!recipe) notFound();

  const [liked, following, saved] = await Promise.all([
    userId
      ? prisma.like.findUnique({ where: { userId_recipeId: { userId, recipeId: id } } })
      : null,
    userId
      ? prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: userId, followingId: recipe.authorId } },
        })
      : null,
    userId
      ? prisma.savedRecipe.findUnique({ where: { userId_recipeId: { userId, recipeId: id } } })
      : null,
  ]);

  const comments = await prisma.comment.findMany({
    where: { recipeId: id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { username: true, avatarUrl: true } } },
  });

  const isAuthor = userId === recipe.authorId;

  return (
    <div className="mx-auto max-w-[630px] px-0 py-0 sm:px-4 sm:py-6">
      <ViewTracker recipeId={recipe.id} />
      <article className="overflow-hidden rounded-none border-0 bg-card sm:rounded-xl sm:border sm:border-border">
        <header className="flex items-center gap-3 p-3">
          <Link href={`/users/${recipe.author.username}`} aria-label={`Profil de ${recipe.author.username}`}>
            <UserAvatar username={recipe.author.username} src={recipe.author.avatarUrl} />
          </Link>
          <div className="min-w-0 flex-1">
            <Link href={`/users/${recipe.author.username}`} className="block text-sm font-semibold hover:underline">
              @{recipe.author.username}
            </Link>
            <span className="text-xs text-muted-foreground">{timeAgo(recipe.createdAt)}</span>
          </div>
          <Badge variant="outline">
            {recipe.category}
          </Badge>
          {!isAuthor ? (
            <FollowButton username={recipe.author.username} initialFollowing={Boolean(following)} variant="compact" />
          ) : (
            <DeleteRecipeButton recipeId={recipe.id} username={recipe.author.username} />
          )}
        </header>

        <div className="relative aspect-square w-full bg-muted">
          <Image src={recipe.imageUrl} alt={recipe.title} fill sizes="630px" priority className="object-cover" />
        </div>

        <div className="flex items-center gap-4 px-4 pt-3">
          <RecipeLikeButton
            recipeId={recipe.id}
            initialLiked={Boolean(liked)}
            initialCount={recipe._count.likes}
          />
          <ShareButton recipeId={recipe.id} />
          <SaveButton recipeId={recipe.id} initialSaved={Boolean(saved)} className="ml-auto" />
          <ReportDialog type="recipe" targetId={recipe.id} aria-label="Signaler cette recette" />
        </div>

        <div className="px-4 pb-5 pt-2">
          <h1 className="font-display text-2xl font-bold leading-tight">{recipe.title}</h1>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{recipe.description}</p>

          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            {recipe.prepTime != null && (
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" /> Prép {recipe.prepTime} min
              </span>
            )}
            {recipe.cookTime != null && (
              <span className="inline-flex items-center gap-1">
                <Flame className="size-3.5" /> Cuisson {recipe.cookTime} min
              </span>
            )}
            {recipe.servings != null && (
              <span className="inline-flex items-center gap-1">
                <Users className="size-3.5" /> {recipe.servings} pers.
              </span>
            )}
          </div>

          <Separator className="my-5" />

          <section>
            <h2 className="mb-3 font-display text-lg font-semibold">Ingrédients</h2>
            <ul className="space-y-1.5">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="flex items-baseline gap-2 text-sm">
                  <span className="size-1.5 shrink-0 translate-y-[-1px] rounded-full bg-primary" />
                  {ing}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-6">
            <h2 className="mb-3 font-display text-lg font-semibold">Préparation</h2>
            <ol className="space-y-3">
              {recipe.steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </section>

          <Separator className="my-6" />

          <CommentSection
            recipeId={recipe.id}
            loggedIn={Boolean(userId)}
            currentUserId={userId ?? null}
            initialCount={recipe._count.comments}
            initialComments={comments.map((c) => ({
              id: c.id,
              body: c.body,
              createdAt: c.createdAt.toISOString(),
              authorId: c.userId,
              author: { username: c.user.username, avatarUrl: c.user.avatarUrl },
            }))}
          />
        </div>
      </article>
    </div>
  );
}