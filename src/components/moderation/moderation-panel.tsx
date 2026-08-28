"use client";

import { useRouter } from "next/navigation";
import { Trash2, Ban, CheckCircle2, CircleSlash, UserRound } from "lucide-react";
import { toast } from "sonner";
import { resolveReport, setSuspended } from "@/actions/reports";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/user-avatar";
import { timeAgo } from "@/lib/format";

export type ReportItem = {
  id: string;
  reason: string;
  details: string | null;
  status: "PENDING" | "RESOLVED" | "DISMISSED";
  createdAt: string;
  reporter: { username: string };
  resolvedBy?: { username: string } | null;
  assignedTo?: { username: string } | null;
  recipe?: { id: string; title: string; imageUrl: string } | null;
  comment?: { id: string; body: string } | null;
  message?: { id: string; body: string } | null;
  user?: { id: string; username: string; bio: string | null } | null;
};

export type UserItem = {
  id: string;
  username: string;
  email: string;
  role: "USER" | "ADMIN";
  suspended: boolean;
  _count: { recipes: number };
};

type Props = {
  pending: ReportItem[];
  processed: ReportItem[];
  users: UserItem[];
};

const STATUS_BADGE = {
  PENDING: "En attente",
  RESOLVED: "Résolu",
  DISMISSED: "Ignoré",
} as const;

const STATUS_VARIANT = {
  PENDING: "default",
  RESOLVED: "outline",
  DISMISSED: "secondary",
} as const;

export function ModerationPanel({ pending, processed, users }: Props) {
  const router = useRouter();

  async function handleResolve(reportId: string, action: "delete" | "dismiss") {
    const res = await resolveReport(reportId, action);
    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    toast.success(action === "delete" ? "Contenu supprimé" : "Signalement ignoré");
    router.refresh();
  }

  async function handleSuspended(username: string, suspended: boolean) {
    const res = await setSuspended(username, suspended);
    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    toast.success(suspended ? `${username} suspendu` : `${username} réactivé`);
    router.refresh();
  }

  return (
    <Tabs defaultValue="reports">
      <TabsList className="w-full justify-start">
        <TabsTrigger value="reports" className="flex-1">
          Signalements ({pending.length})
        </TabsTrigger>
        <TabsTrigger value="users" className="flex-1">
          Utilisateurs ({users.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="reports" className="mt-4 space-y-4">
        {pending.length === 0 ? (
          <p className="rounded-xl border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
            Aucun signalement en attente. Tout est calme.
          </p>
        ) : (
          pending.map((r) => (
            <ReportCard key={r.id} report={r} onResolve={handleResolve} onSuspend={handleSuspended} />
          ))
        )}

        {processed.length > 0 && (
          <details className="group rounded-xl border border-border bg-card">
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">
              Signalements traités ({processed.length})
            </summary>
            <div className="divide-y divide-border">
              {processed.map((r) => (
                <ReportCard key={r.id} report={r} onResolve={handleResolve} onSuspend={handleSuspended} />
              ))}
            </div>
          </details>
        )}
      </TabsContent>

      <TabsContent value="users" className="mt-4 space-y-3">
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {users.map((u) => (
            <li key={u.id} className="flex items-center gap-3 px-4 py-3">
              <UserAvatar username={u.username} src={null} size="md" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 truncate text-sm font-semibold">
                  {u.username}
                  {u.role === "ADMIN" && (
                    <Badge variant="default">Admin</Badge>
                  )}
                  {u.suspended && <Badge variant="destructive">Suspendu</Badge>}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {u._count.recipes} recette{u._count.recipes > 1 ? "s" : ""} · {u.email}
                </p>
              </div>
              {u.role !== "ADMIN" && (
                <Button
                  size="sm"
                  variant={u.suspended ? "outline" : "destructive"}
                  className="shrink-0"
                  onClick={() => handleSuspended(u.username, !u.suspended)}
                >
                  {u.suspended ? <CheckCircle2 className="mr-1.5 size-4" /> : <Ban className="mr-1.5 size-4" />}
                  {u.suspended ? "Réactiver" : "Suspendre"}
                </Button>
              )}
            </li>
          ))}
        </ul>
      </TabsContent>
    </Tabs>
  );
}

function ReportCard({
  report: r,
  onResolve,
  onSuspend,
}: {
  report: ReportItem;
  onResolve: (reportId: string, action: "delete" | "dismiss") => void;
  onSuspend: (username: string, suspended: boolean) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant={STATUS_VARIANT[r.status]}>{STATUS_BADGE[r.status]}</Badge>
          <span className="text-sm font-semibold">{r.reason}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {timeAgo(r.createdAt)}
          {r.resolvedBy
            ? ` · traité par @${r.resolvedBy.username}`
            : ` · signalé par @${r.reporter.username}`}
          {r.assignedTo ? ` · assigné à @${r.assignedTo.username}` : ""}
        </span>
      </div>

      <div className="rounded-lg bg-muted p-3 text-sm">
        {r.recipe && (
          <p>
            <span className="font-semibold">Recette :</span> {r.recipe.title}
          </p>
        )}
        {r.comment && (
          <p>
            <span className="font-semibold">Commentaire :</span> {r.comment.body}
          </p>
        )}
        {r.message && (
          <p>
            <span className="font-semibold">Message :</span> {r.message.body}
          </p>
        )}
        {r.user && (
          <p>
            <span className="font-semibold">Compte :</span> @{r.user.username}
            {r.user.bio ? ` · ${r.user.bio}` : ""}
          </p>
        )}
        {r.details && (
          <p className="mt-1 text-xs text-muted-foreground">
            <span className="font-semibold">Détails :</span> {r.details}
          </p>
        )}
      </div>

      {r.status === "PENDING" && (
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="destructive" onClick={() => onResolve(r.id, "delete")}>
            <Trash2 className="mr-1.5 size-4" />
            Supprimer le contenu
          </Button>
          <Button size="sm" variant="secondary" onClick={() => onResolve(r.id, "dismiss")}>
            <CircleSlash className="mr-1.5 size-4" />
            Ignorer
          </Button>
          {r.user && (
            <Button size="sm" variant="outline" onClick={() => onSuspend(r.user!.username, true)}>
              <UserRound className="mr-1.5 size-4" />
              Suspendre
            </Button>
          )}
        </div>
      )}
    </div>
  );
}