"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { removeImageIfSupabase, SUPABASE_AVATAR_BUCKET } from "@/lib/supabase";

export async function updateAvatar(
  avatarUrl: string | null
): Promise<{ ok: true } | { error: string }> {
  const session = await getSession();
  if (!session.userId) return { error: "Non connecté" };

  const me = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, username: true, avatarUrl: true, suspended: true },
  });
  if (!me) return { error: "Compte introuvable" };
  if (me.suspended) return { error: "Ton compte est suspendu. Contacte un administrateur." };

  if (avatarUrl !== null) {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const prefix = `${base}/storage/v1/object/public/${SUPABASE_AVATAR_BUCKET}/`;
    if (!base || !avatarUrl.startsWith(prefix)) {
      return { error: "URL de photo invalide" };
    }
  }

  await prisma.user.update({ where: { id: me.id }, data: { avatarUrl } });

  if (me.avatarUrl && me.avatarUrl !== avatarUrl) {
    await removeImageIfSupabase(me.avatarUrl);
  }

  revalidatePath(`/users/${me.username}`);
  return { ok: true };
}