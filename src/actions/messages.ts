"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { findConversation, normalizePair } from "@/lib/chat";
import { stripControlChars } from "@/lib/sanitize";
import { BLOCKED_CONTENT_MESSAGE, hasBlockedContent } from "@/lib/moderation";
import { removeImageIfSupabase } from "@/lib/supabase";

export type MessageResult = {
  id: string;
  body: string;
  imageUrl: string | null;
  createdAt: string;
  senderId: string;
  editedAt: string | null;
};

const CHAT_IMAGE_PREFIX = (() => {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return base ? `${base}/storage/v1/object/public/chat-images/` : null;
})();

function isValidChatImage(imageUrl: string): boolean {
  return !!CHAT_IMAGE_PREFIX && imageUrl.startsWith(CHAT_IMAGE_PREFIX);
}

export async function sendMessage(
  username: string,
  body: string,
  imageUrl: string | null = null
): Promise<{ ok: true; message: MessageResult } | { error: string }> {
  const session = await getSession();
  if (!session.userId) return { error: "Connecte-toi pour envoyer un message" };

  const me = await prisma.user.findUnique({ where: { id: session.userId }, select: { id: true, suspended: true } });
  if (!me) return { error: "Compte introuvable" };
  if (me.suspended) return { error: "Ton compte est suspendu. Contacte un administrateur." };

  const other = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (!other) return { error: "Utilisateur introuvable" };
  if (other.id === me.id) return { error: "Impossible de s'écrire à soi-même" };

  const [fwd, back] = await Promise.all([
    prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: me.id, followingId: other.id } },
    }),
    prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: other.id, followingId: me.id } },
    }),
  ]);
  if (!fwd || !back)
    return { error: "Vous devez être abonnés mutuellement pour discuter" };

  const trimmed = stripControlChars(body).trim();
  if (!trimmed && !imageUrl) return { error: "Message vide" };
  if (trimmed.length > 2000) return { error: "Message trop long (2000 caractères max)" };
  if (trimmed && hasBlockedContent(trimmed)) return { error: BLOCKED_CONTENT_MESSAGE };
  if (imageUrl && !isValidChatImage(imageUrl)) return { error: "Image invalide" };

  let conversation = await findConversation(me.id, other.id);
  if (!conversation) {
    conversation = await prisma.conversation.create({ data: normalizePair(me.id, other.id) });
  }

  const message = await prisma.message.create({
    data: { conversationId: conversation.id, senderId: me.id, body: trimmed, imageUrl },
  });
  await prisma.conversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } });

  revalidatePath("/messages");
  revalidatePath(`/messages/${username}`);
  return {
    ok: true,
    message: {
      id: message.id,
      body: message.body,
      imageUrl: message.imageUrl,
      createdAt: message.createdAt.toISOString(),
      senderId: message.senderId,
      editedAt: null,
    },
  };
}

export async function updateMessage(
  messageId: string,
  body: string
): Promise<{ ok: true; message: MessageResult } | { error: string }> {
  const session = await getSession();
  if (!session.userId) return { error: "Connecte-toi pour modifier un message" };

  const me = await prisma.user.findUnique({ where: { id: session.userId }, select: { id: true, suspended: true } });
  if (!me) return { error: "Compte introuvable" };
  if (me.suspended) return { error: "Ton compte est suspendu. Contacte un administrateur." };

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { conversation: { select: { userAId: true, userBId: true } } },
  });
  if (!message) return { error: "Message introuvable" };
  if (message.senderId !== me.id) return { error: "Tu ne peux modifier que tes propres messages" };

  const trimmed = stripControlChars(body).trim();
  if (!trimmed) return { error: "Message vide" };
  if (trimmed.length > 2000) return { error: "Message trop long (2000 caractères max)" };
  if (hasBlockedContent(trimmed)) return { error: BLOCKED_CONTENT_MESSAGE };

  const updated = await prisma.message.update({
    where: { id: message.id },
    data: { body: trimmed, editedAt: new Date() },
  });
  await prisma.conversation.update({
    where: { id: message.conversationId },
    data: { updatedAt: new Date() },
  });

  const otherId =
    message.conversation.userAId === me.id ? message.conversation.userBId : message.conversation.userAId;
  const other = await prisma.user.findUnique({ where: { id: otherId }, select: { username: true } });

  revalidatePath("/messages");
  revalidatePath(`/messages/${other?.username ?? ""}`);
  return {
    ok: true,
    message: {
      id: updated.id,
      body: updated.body,
      imageUrl: updated.imageUrl,
      createdAt: updated.createdAt.toISOString(),
      senderId: updated.senderId,
      editedAt: updated.editedAt?.toISOString() ?? null,
    },
  };
}

export async function deleteMessage(messageId: string): Promise<{ ok: true } | { error: string }> {
  const session = await getSession();
  if (!session.userId) return { error: "Connecte-toi pour supprimer un message" };

  const me = await prisma.user.findUnique({ where: { id: session.userId }, select: { id: true } });
  if (!me) return { error: "Compte introuvable" };

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { conversation: { select: { userAId: true, userBId: true } } },
  });
  if (!message) return { error: "Message introuvable" };
  if (message.senderId !== me.id) return { error: "Tu ne peux supprimer que tes propres messages" };

  await prisma.message.delete({ where: { id: message.id } });
  await prisma.conversation.update({
    where: { id: message.conversationId },
    data: { updatedAt: new Date() },
  });
  if (message.imageUrl) await removeImageIfSupabase(message.imageUrl);

  const otherId =
    message.conversation.userAId === me.id ? message.conversation.userBId : message.conversation.userAId;
  const other = await prisma.user.findUnique({ where: { id: otherId }, select: { username: true } });

  revalidatePath("/messages");
  revalidatePath(`/messages/${other?.username ?? ""}`);
  return { ok: true };
}