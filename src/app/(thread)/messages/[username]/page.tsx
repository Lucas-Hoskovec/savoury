import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { findConversation } from "@/lib/chat";
import { UserAvatar } from "@/components/user-avatar";
import { MessageThread } from "@/components/chat/message-thread";

export default async function ThreadPage(props: { params: Promise<{ username: string }> }) {
  const { username } = await props.params;
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const me = await prisma.user.findUnique({ where: { id: session.userId }, select: { id: true } });
  const other = await prisma.user.findUnique({
    where: { username },
    select: { id: true, username: true, avatarUrl: true },
  });
  if (!me || !other) notFound();

  const [fwd, back] = await Promise.all([
    prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: me.id, followingId: other.id } },
    }),
    prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: other.id, followingId: me.id } },
    }),
  ]);

  const conversation = await findConversation(me.id, other.id);
  const messages = conversation
    ? await prisma.message.findMany({
        where: { conversationId: conversation.id },
        orderBy: { createdAt: "asc" },
        take: 200,
      })
    : [];

  return (
    <div className="mx-auto flex h-dvh max-w-[630px] flex-col">
      <header className="flex items-center gap-3 border-b border-border p-3">
        <Link
          href="/messages"
          aria-label="Retour aux messages"
          className="grid size-9 place-items-center rounded-full transition-colors hover:bg-muted"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <Link href={`/users/${other.username}`} className="flex min-w-0 items-center gap-3">
          <UserAvatar username={other.username} src={other.avatarUrl} />
          <span className="truncate text-sm font-semibold">@{other.username}</span>
        </Link>
      </header>

      {!fwd || !back ? (
        <div className="grid flex-1 place-items-center px-6 text-center">
          <p className="text-sm text-muted-foreground">
            Vous devez être <span className="font-semibold">abonnés mutuellement</span> pour
            discuter avec @{other.username}.
          </p>
        </div>
      ) : (
        <MessageThread
          otherUsername={other.username}
          myId={me.id}
          initialMessages={messages.map((m) => ({
            id: m.id,
            body: m.body,
            imageUrl: m.imageUrl,
            createdAt: m.createdAt.toISOString(),
            senderId: m.senderId,
            editedAt: m.editedAt?.toISOString() ?? null,
          }))}
        />
      )}
    </div>
  );
}