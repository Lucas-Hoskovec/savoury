"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { compare, hash } from "bcryptjs";
import { getIronSession } from "iron-session";
import { prisma } from "@/lib/prisma";
import { getSession, makeSessionOptions, type SessionData } from "@/lib/auth";
import { loginSchema, registerSchema } from "@/lib/validation";
import { removeImagesIfSupabase } from "@/lib/supabase";

export type AuthState = { error?: string };

function firstError(parsed: { error?: { issues?: { message: string }[] } }) {
  return parsed.error?.issues?.[0]?.message ?? "Formulaire invalide";
}

export async function register(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) return { error: firstError(parsed) };

  const { username, email, password } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
    select: { username: true, email: true },
  });
  if (existing) {
    const field = existing.username === username ? "username" : "email";
    return { error: field === "username" ? "Ce pseudo est déjà pris" : "Cet email est déjà utilisé" };
  }

  const passwordHash = await hash(password, 12);
  const user = await prisma.user.create({
    data: { username, email, passwordHash },
  });

  const session = await getSession();
  session.userId = user.id;
  await session.save();

  redirect("/");
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: firstError(parsed) };

  const { identifier, password } = parsed.data;

  const user = await prisma.user.findFirst({
    where: { OR: [{ username: identifier }, { email: identifier }] },
  });
  if (!user) return { error: "Identifiants incorrects" };
  if (user.suspended) return { error: "Ce compte est suspendu. Contacte un administrateur." };

  const ok = await compare(password, user.passwordHash);
  if (!ok) return { error: "Identifiants incorrects" };

  const remember = formData.get("remember") === "on";
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, makeSessionOptions(remember));
  session.userId = user.id;
  await session.save();

  redirect("/");
}

export async function logout() {
  const session = await getSession();
  session.destroy();
  redirect("/");
}

export async function deleteAccount(): Promise<{ ok: true } | { error: string }> {
  const session = await getSession();
  if (!session.userId) return { error: "Non connecté" };

  const me = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, avatarUrl: true },
  });
  if (!me) return { error: "Compte introuvable" };

  const [recipes, messages] = await Promise.all([
    prisma.recipe.findMany({ where: { authorId: me.id }, select: { imageUrl: true } }),
    prisma.message.findMany({
      where: { senderId: me.id, imageUrl: { not: null } },
      select: { imageUrl: true },
    }),
  ]);

  await prisma.user.delete({ where: { id: me.id } });

  const imageUrls = [
    ...(me.avatarUrl ? [me.avatarUrl] : []),
    ...recipes.map((r) => r.imageUrl),
    ...messages.map((m) => m.imageUrl).filter((url): url is string => Boolean(url)),
  ];
  await removeImagesIfSupabase(imageUrls);

  session.destroy();
  redirect("/");
}