import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlusSquare } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { FollowButton } from "@/components/follow-button";
import { RecipeGridCard } from "@/components/feed/recipe-grid-card";
import { SocialStats } from "@/components/profile/social-stats";
import { AvatarEditor } from "@/components/profile/avatar-editor";
import { ReportDialog } from "@/components/moderation/report-dialog";

export async function generateMetadata(props: PageProps<"/users/[username]">): Promise<Metadata> {
  const { username } = await props.params;
  return { title: `${username} · Savoury` };
}

export default async function UserPage(props: PageProps<"/users/[username]">) {
  const { username } = await props.params;
  const session = await getSession();
  const userId = session.userId;

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      recipes: {
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { likes: true, comments: true } } },
      },
      _count: { select: { followers: true, following: true } },
    },
  });

  if (!user) notFound();

  const following = userId
    ? await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: userId, followingId: user.id } },
      })
    : null;

  const isSelf = userId === user.id;

  const [followers, followedUsers] = await Promise.all([
    prisma.follow.findMany({
      where: { followingId: user.id },
      orderBy: { createdAt: "desc" },
      include: { follower: { select: { username: true, avatarUrl: true, bio: true } } },
    }),
    prisma.follow.findMany({
      where: { followerId: user.id },
      orderBy: { createdAt: "desc" },
      include: { following: { select: { username: true, avatarUrl: true, bio: true } } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-[935px] px-4 py-6">
      <header className="flex items-center gap-6 md:gap-16">
        {isSelf ? (
          <AvatarEditor username={user.username} initialAvatarUrl={user.avatarUrl} />
        ) : (
          <UserAvatar username={user.username} src={user.avatarUrl} size="xl" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="truncate text-xl font-semibold">{user.username}</h1>
            {isSelf ? (
              <Button asChild variant="secondary" size="sm" className="rounded-full">
                <Link href="/recipes/new">
                  <PlusSquare className="mr-1.5 size-4" />
                  Publier une recette
                </Link>
              </Button>
            ) : (
              <div className="flex items-center gap-1.5">
                <FollowButton username={user.username} initialFollowing={Boolean(following)} variant="compact" />
                <ReportDialog type="user" targetId={user.id} aria-label="Signaler ce compte" />
              </div>
            )}
          </div>
          <SocialStats
            recipeCount={user.recipes.length}
            followers={followers.map((f) => f.follower)}
            following={followedUsers.map((f) => f.following)}
          />
          {user.bio && <p className="mt-3 text-sm leading-relaxed">{user.bio}</p>}
        </div>
      </header>

      <div className="mt-8 border-t border-border pt-6">
        {user.recipes.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">
            {isSelf ? "Tu n'as pas encore partagé de recette." : "Aucune recette publiée pour le moment."}
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-1 sm:gap-2">
            {user.recipes.map((r) => (
              <RecipeGridCard
                key={r.id}
                recipe={{ ...r, likeCount: r._count.likes, commentCount: r._count.comments }}
                canDelete={isSelf}
                username={user.username}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}