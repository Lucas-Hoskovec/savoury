"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MessageCircle, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { addComment, deleteComment, type CommentResult } from "@/actions/interactions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/user-avatar";
import { ReportDialog } from "@/components/moderation/report-dialog";
import { timeAgo } from "@/lib/format";

type Props = {
  recipeId: string;
  loggedIn: boolean;
  currentUserId: string | null;
  initialComments: CommentResult[];
  initialCount: number;
};

export function CommentSection({
  recipeId,
  loggedIn,
  currentUserId,
  initialComments,
  initialCount,
}: Props) {
  const router = useRouter();
  const [comments, setComments] = useState<CommentResult[]>(initialComments);
  const [count, setCount] = useState(initialCount);
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text || pending) return;
    setPending(true);
    const res = await addComment(recipeId, text);
    setPending(false);
    if ("error" in res) {
      toast.error(res.error);
      if (res.error === "Connecte-toi pour commenter") router.push("/login");
      return;
    }
    setComments((prev) => [...prev, res.comment]);
    setCount((c) => c + 1);
    setBody("");
  }

  async function handleDelete(commentId: string) {
    if (!window.confirm("Supprimer ce commentaire ?")) return;
    const res = await deleteComment(commentId, recipeId);
    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setCount((c) => c - 1);
    toast.success("Commentaire supprimé");
  }

  return (
    <section className="mt-2 space-y-4">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
        <MessageCircle className="size-5" />
        Commentaires ({count})
      </h2>

      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun commentaire pour le moment.</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex items-start gap-3">
              <Link href={`/users/${c.author.username}`} className="shrink-0">
                <UserAvatar username={c.author.username} src={c.author.avatarUrl} size="sm" />
              </Link>
              <div className="min-w-0 flex-1 rounded-xl bg-muted px-3 py-2">
                <div className="flex items-baseline justify-between gap-2">
                  <Link
                    href={`/users/${c.author.username}`}
                    className="text-sm font-semibold hover:underline"
                  >
                    @{c.author.username}
                  </Link>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="text-[11px] text-muted-foreground">{timeAgo(c.createdAt)}</span>
                    {c.authorId === currentUserId && (
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id)}
                        aria-label="Supprimer le commentaire"
                        className="text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                    <ReportDialog type="comment" targetId={c.id} aria-label="Signaler ce commentaire" />
                  </div>
                </div>
                <p className="text-sm leading-snug">{c.body}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {loggedIn ? (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Ajoute un commentaire…"
            className="flex-1 rounded-full"
            maxLength={1000}
          />
          <Button
            type="submit"
            size="icon"
            className="size-10 shrink-0 rounded-full"
            disabled={!body.trim() || pending}
            aria-label="Envoyer le commentaire"
          >
            <Send className="size-4" />
          </Button>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Connecte-toi
          </Link>{" "}
          pour commenter cette recette.
        </p>
      )}
    </section>
  );
}