import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { UserAvatar } from "@/components/user-avatar";
import { FollowButton } from "@/components/follow-button";
import { formatCount } from "@/lib/format";

export async function SuggestedSidebar() {
  const session = await getSession();
  const userId = session.userId;

  const suggested = await prisma.user.findMany({
    where: userId ? { id: { not: userId } } : undefined,
    orderBy: { followers: { _count: "desc" } },
    take: 5,
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      bio: true,
      _count: { select: { followers: true } },
    },
  });

  const followingSet = new Set<string>();
  if (userId) {
    const follows = await prisma.follow.findMany({
      where: { followerId: userId, followingId: { in: suggested.map((s) => s.id) } },
      select: { followingId: true },
    });
    follows.forEach((f) => followingSet.add(f.followingId));
  }

  if (suggested.length === 0) return null;

  return (
    <aside className="hidden w-72 shrink-0 xl:block">
      <div className="sticky top-20">
        <h2 className="mb-3 px-1 text-sm font-semibold text-muted-foreground">Suggestions pour vous</h2>
        <div className="space-y-3">
          {suggested.map((user) => (
            <div key={user.id} className="flex items-center gap-3 px-1">
              <Link href={`/users/${user.username}`} className="shrink-0">
                <UserAvatar username={user.username} src={user.avatarUrl} />
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/users/${user.username}`}
                  className="block truncate text-sm font-semibold hover:underline"
                >
                  @{user.username}
                </Link>
                <p className="truncate text-xs text-muted-foreground">
                  {formatCount(user._count.followers)} abonné{user._count.followers > 1 ? "s" : ""}
                </p>
              </div>
              <FollowButton
                username={user.username}
                initialFollowing={followingSet.has(user.id)}
                variant="compact"
              />
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}