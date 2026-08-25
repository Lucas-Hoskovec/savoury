"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { commentSchema } from "@/lib/validation";
import { BLOCKED_CONTENT_MESSAGE, hasBlockedContent } from "@/lib/moderation";

const SUSPENDED_MESSAGE = "Ton compte est suspendu. Contacte un administrateur.";

async function isSuspended(userId: string) {
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { suspended: true } });
  return me?.suspended ?? false;
}

export async function toggleLike(recipeId: string): Promise<{ liked: boolean; count: number } | { error: string }> {
  const session = await getSession();
  if (!session.userId) return { error: "Connecte-toi pour aimer" };
  if (await isSuspended(session.userId)) return { error: SUSPENDED_MESSAGE };

  const existing = await prisma.like.findUnique({
    where: { userId_recipeId: { userId: session.userId, recipeId } },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
  } else {
    await prisma.like.create({ data: { userId: session.userId, recipeId } });
  }

  const count = await prisma.like.count({ where: { recipeId } });
  revalidatePath("/");
  revalidatePath(`/recipes/${recipeId}`);
  return { liked: !existing, count };
}

export async function toggleSave(recipeId: string): Promise<{ saved: boolean } | { error: string }> {
  const session = await getSession();
  if (!session.userId) return { error: "Connecte-toi pour enregistrer" };
  if (await isSuspended(session.userId)) return { error: SUSPENDED_MESSAGE };

  const existing = await prisma.savedRecipe.findUnique({
    where: { userId_recipeId: { userId: session.userId, recipeId } },
  });

  if (existing) {
    await prisma.savedRecipe.delete({ where: { id: existing.id } });
  } else {
    await prisma.savedRecipe.create({ data: { userId: session.userId, recipeId } });
  }

  revalidatePath("/");
  revalidatePath(`/recipes/${recipeId}`);
  revalidatePath("/saved");
  return { saved: !existing };
}

export async function recordRecipeView(recipeId: string): Promise<{ ok: true }> {
  await prisma.recipe.update({
    where: { id: recipeId },
    data: { views: { increment: 1 } },
  });
  return { ok: true };
}

export async function addComment(
  recipeId: string,
  body: string
): Promise<{ ok: true; comment: CommentResult } | { error: string }> {
  const session = await getSession();
  if (!session.userId) return { error: "Connecte-toi pour commenter" };
  if (await isSuspended(session.userId)) return { error: SUSPENDED_MESSAGE };

  const parsed = commentSchema.safeParse({ body });
  if (!parsed.success) return { error: "Commentaire invalide" };
  if (hasBlockedContent(parsed.data.body)) return { error: BLOCKED_CONTENT_MESSAGE };

  const comment = await prisma.comment.create({
    data: { recipeId, userId: session.userId, body: parsed.data.body },
    include: { user: { select: { id: true, username: true, avatarUrl: true } } },
  });

  revalidatePath(`/recipes/${recipeId}`);
  return {
    ok: true,
    comment: {
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
      authorId: comment.user.id,
      author: comment.user,
    },
  };
}

export type CommentResult = {
  id: string;
  body: string;
  createdAt: string;
  authorId: string;
  author: { username: string; avatarUrl: string | null };
};

export async function deleteComment(
  commentId: string,
  recipeId: string
): Promise<{ ok: true } | { error: string }> {
  const session = await getSession();
  if (!session.userId) return { error: "Connecte-toi pour supprimer un commentaire" };

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { userId: true },
  });
  if (!comment) return { error: "Commentaire introuvable" };
  if (comment.userId !== session.userId)
    return { error: "Tu ne peux supprimer que tes propres commentaires" };

  await prisma.comment.delete({ where: { id: commentId } });
  revalidatePath(`/recipes/${recipeId}`);
  return { ok: true };
}

export async function toggleFollow(username: string): Promise<{ following: boolean } | { error: string }> {
  const session = await getSession();
  if (!session.userId) return { error: "Connecte-toi pour suivre" };
  if (await isSuspended(session.userId)) return { error: SUSPENDED_MESSAGE };

  const target = await prisma.user.findUnique({ where: { username } });
  if (!target) return { error: "Utilisateur introuvable" };
  if (target.id === session.userId) return { error: "Impossible de se suivre soi-même" };

  const existing = await prisma.follow.findUnique({
    where: {
      followerId_followingId: { followerId: session.userId, followingId: target.id },
    },
  });

  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
  } else {
    await prisma.follow.create({
      data: { followerId: session.userId, followingId: target.id },
    });
  }

  revalidatePath(`/users/${username}`);
  return { following: !existing };
}