import { cookies } from "next/headers";
import { getIronSession, type IronSession, type SessionOptions } from "iron-session";
import { prisma } from "@/lib/prisma";

export type SessionData = {
  userId?: string;
};

export const sessionOptions: SessionOptions = {
  password: process.env.AUTH_SECRET ?? "fallback-secret-change-me-please-0123456789abcdef",
  cookieName: "savoury-session",
  ttl: 0,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: undefined,
  },
};

export function makeSessionOptions(remember: boolean): SessionOptions {
  if (!remember) return sessionOptions;
  return {
    ...sessionOptions,
    ttl: 0,
    cookieOptions: { ...sessionOptions.cookieOptions, maxAge: 2147483647 },
  };
}

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  const userId = session.userId;
  if (!userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      bio: true,
      avatarUrl: true,
      role: true,
      suspended: true,
      createdAt: true,
    },
  });
  return user;
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session.userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, username: true, role: true, suspended: true },
  });
  if (!user || user.suspended || user.role !== "ADMIN") return null;
  return user;
}