import { redirect } from "next/navigation";
import { Shield } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { purgeExpiredReports } from "@/lib/moderation";
import { ModerationPanel } from "@/components/moderation/moderation-panel";

export default async function ModerationPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/");

  await purgeExpiredReports();

  const [rawPending, rawProcessed, users] = await Promise.all([
    prisma.report.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: 50,
      include: {
        reporter: { select: { username: true } },
        recipe: { select: { id: true, title: true, imageUrl: true } },
        comment: { select: { id: true, body: true } },
        message: { select: { id: true, body: true } },
        user: { select: { id: true, username: true, bio: true } },
      },
    }),
    prisma.report.findMany({
      where: { status: { in: ["RESOLVED", "DISMISSED"] } },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        reporter: { select: { username: true } },
        resolvedBy: { select: { username: true } },
        recipe: { select: { id: true, title: true, imageUrl: true } },
        comment: { select: { id: true, body: true } },
        message: { select: { id: true, body: true } },
        user: { select: { id: true, username: true, bio: true } },
      },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { recipes: true } } },
    }),
  ]);

  const pendingReports = rawPending.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
  const processedReports = rawProcessed.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));

  return (
    <div className="mx-auto max-w-[935px] px-4 py-6">
      <header className="mb-6 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
          <Shield className="size-5" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold">Modération</h1>
          <p className="text-sm text-muted-foreground">Signalements et comptes utilisateurs.</p>
        </div>
      </header>

      <ModerationPanel pending={pendingReports} processed={processedReports} users={users} />
    </div>
  );
}