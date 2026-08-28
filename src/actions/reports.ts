"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession, requireAdmin } from "@/lib/auth";
import { REPORT_REASONS } from "@/lib/moderation";
import { removeImageIfSupabase } from "@/lib/supabase";

export type TargetType = "recipe" | "comment" | "message" | "user";

type CreateReportInput = {
  type: TargetType;
  targetId: string;
  reason: string;
  details?: string;
};

/** Pick the admin with the fewest pending assigned reports. */
async function pickAssigneeId(): Promise<string | null> {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", suspended: false },
    select: { id: true },
  });
  if (admins.length === 0) return null;

  const counts = await prisma.report.groupBy({
    by: ["assignedToId"],
    where: { status: "PENDING", assignedToId: { in: admins.map((a) => a.id) } },
    _count: { _all: true },
  });

  const load = new Map<string, number>();
  for (const a of admins) load.set(a.id, 0);
  for (const c of counts) {
    if (c.assignedToId) load.set(c.assignedToId, c._count._all);
  }

  let best: string | null = null;
  let bestCount = Infinity;
  for (const a of admins) {
    const n = load.get(a.id) ?? 0;
    if (n < bestCount) {
      bestCount = n;
      best = a.id;
    }
  }
  return best;
}

export async function createReport(
  input: CreateReportInput
): Promise<{ ok: true } | { error: string }> {
  const session = await getSession();
  if (!session.userId) return { error: "Connecte-toi pour signaler" };

  if (!(REPORT_REASONS as readonly string[]).includes(input.reason))
    return { error: "Motif de signalement invalide" };
  const details = (input.details ?? "").trim().slice(0, 500) || null;

  let recipeId: string | undefined;
  let commentId: string | undefined;
  let messageId: string | undefined;
  let userId: string | undefined;

  if (input.type === "recipe") {
    const t = await prisma.recipe.findUnique({ where: { id: input.targetId }, select: { id: true } });
    if (!t) return { error: "Recette introuvable" };
    recipeId = t.id;
  } else if (input.type === "comment") {
    const t = await prisma.comment.findUnique({ where: { id: input.targetId }, select: { id: true } });
    if (!t) return { error: "Commentaire introuvable" };
    commentId = t.id;
  } else if (input.type === "message") {
    const t = await prisma.message.findUnique({ where: { id: input.targetId }, select: { id: true } });
    if (!t) return { error: "Message introuvable" };
    messageId = t.id;
  } else if (input.type === "user") {
    const t = await prisma.user.findUnique({ where: { id: input.targetId }, select: { id: true } });
    if (!t) return { error: "Compte introuvable" };
    if (t.id === session.userId) return { error: "Impossible de signaler ton propre compte" };
    userId = t.id;
  }

  const existing = await prisma.report.findFirst({
    where: {
      reporterId: session.userId,
      status: "PENDING",
      ...(recipeId ? { recipeId } : {}),
      ...(commentId ? { commentId } : {}),
      ...(messageId ? { messageId } : {}),
      ...(userId ? { userId } : {}),
    },
  });
  if (existing) return { error: "Tu as déjà signalé ce contenu" };

  const assignedToId = await pickAssigneeId();

  await prisma.report.create({
    data: {
      reporterId: session.userId,
      reason: input.reason,
      details,
      recipeId,
      commentId,
      messageId,
      userId,
      assignedToId,
    },
  });

  return { ok: true };
}

export async function resolveReport(
  reportId: string,
  action: "delete" | "dismiss"
): Promise<{ ok: true } | { error: string }> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Action réservée aux administrateurs" };

  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: {
      recipe: { select: { id: true, imageUrl: true } },
      message: { select: { id: true, imageUrl: true } },
      comment: { select: { id: true } },
    },
  });
  if (!report) return { error: "Signalement introuvable" };
  if (report.status !== "PENDING") return { error: "Signalement déjà traité" };

  if (action === "delete") {
    if (report.recipe) await prisma.recipe.delete({ where: { id: report.recipe.id } });
    if (report.comment) await prisma.comment.delete({ where: { id: report.comment.id } });
    if (report.message) await prisma.message.delete({ where: { id: report.message.id } });
    if (report.recipe) await removeImageIfSupabase(report.recipe.imageUrl);
    if (report.message?.imageUrl) await removeImageIfSupabase(report.message.imageUrl);
  }

  await prisma.report.update({
    where: { id: report.id },
    data: {
      status: action === "delete" ? "RESOLVED" : "DISMISSED",
      resolvedAt: new Date(),
      resolvedById: admin.id,
      resolvedAction: action,
    },
  });

  revalidatePath("/moderation");
  return { ok: true };
}

export async function setSuspended(
  username: string,
  suspended: boolean
): Promise<{ ok: true } | { error: string }> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Action réservée aux administrateurs" };

  const target = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (!target) return { error: "Utilisateur introuvable" };
  if (target.id === admin.id) return { error: "Impossible de suspendre ton propre compte" };

  await prisma.user.update({ where: { id: target.id }, data: { suspended } });
  revalidatePath("/moderation");
  revalidatePath(`/users/${username}`);
  return { ok: true };
}