import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageCircle, PenSquare } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { UserAvatar } from "@/components/user-avatar";
import { timeAgo } from "@/lib/format";

export default async function MessagesPage() {
  const session = await getSession();
  if (!session.userId) redirect("/login");
  const userId = session.userId;

  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }] },
    orderBy: { updatedAt: "desc" },
    include: {
      userA: { select: { username: true, avatarUrl: true } },
      userB: { select: { username: true, avatarUrl: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const threads = conversations.map((c) => {
    const other = c.userAId === userId ? c.userB : c.userA;
    const last = c.messages[0];
    return {
      username: other.username,
      avatarUrl: other.avatarUrl,
      lastBody: last?.imageUrl && !last?.body ? "🖼️ Image" : (last?.body ?? ""),
      lastAt: last?.createdAt.toISOString() ?? null,
    };
  });

  const chattedIds = conversations.map((c) => (c.userAId === userId ? c.userBId : c.userAId));

  const myFollowing = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  const mutuals = await prisma.follow.findMany({
    where: {
      followingId: userId,
      followerId: { in: myFollowing.map((f) => f.followingId), notIn: chattedIds },
    },
    orderBy: { createdAt: "desc" },
    include: { follower: { select: { username: true, avatarUrl: true, bio: true } } },
  });

  return (
    <div className="mx-auto max-w-[630px] px-4 py-6">
      <h1 className="flex items-center gap-2 font-display text-2xl font-bold">
        <MessageCircle className="size-6" />
        Messages
      </h1>

      <section className="mt-6">
        {threads.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground">
            Aucune conversation pour le moment.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {threads.map((t) => (
              <li key={t.username}>
                <Link
                  href={`/messages/${t.username}`}
                  className="flex items-center gap-3 rounded-md p-3 transition-colors hover:bg-muted"
                >
                  <UserAvatar username={t.username} src={t.avatarUrl} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">@{t.username}</p>
                    {t.lastBody && (
                      <p className="truncate text-xs text-muted-foreground">{t.lastBody}</p>
                    )}
                  </div>
                  {t.lastAt && (
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {timeAgo(t.lastAt)}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <PenSquare className="size-5" />
          Nouveau message
        </h2>
        {mutuals.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Vous pouvez discuter avec les comptes qui vous suivent en retour.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {mutuals.map((m) => (
              <li key={m.follower.username}>
                <Link
                  href={`/messages/${m.follower.username}`}
                  className="flex items-center gap-3 rounded-md p-2.5 transition-colors hover:bg-muted"
                >
                  <UserAvatar username={m.follower.username} src={m.follower.avatarUrl} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">@{m.follower.username}</p>
                    {m.follower.bio && (
                      <p className="truncate text-xs text-muted-foreground">{m.follower.bio}</p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}