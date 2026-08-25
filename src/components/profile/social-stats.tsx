"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserAvatar } from "@/components/user-avatar";
import { formatCount } from "@/lib/format";

type Person = { username: string; avatarUrl: string | null; bio: string | null };

type Props = {
  recipeCount: number;
  followers: Person[];
  following: Person[];
};

export function SocialStats({ recipeCount, followers, following }: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"followers" | "following">("followers");

  const list = tab === "followers" ? followers : following;
  const title = tab === "followers" ? "Abonnés" : "Abonnements";

  return (
    <>
      <ul className="mt-3 flex gap-6 text-sm">
        <li>
          <span className="font-semibold">{recipeCount}</span>{" "}
          <span className="text-muted-foreground">recette{recipeCount > 1 ? "s" : ""}</span>
        </li>
        <li>
          <button
            type="button"
            onClick={() => {
              setTab("followers");
              setOpen(true);
            }}
            className="transition-opacity hover:opacity-70"
          >
            <span className="font-semibold">{formatCount(followers.length)}</span>{" "}
            <span className="text-muted-foreground">abonné{followers.length > 1 ? "s" : ""}</span>
          </button>
        </li>
        <li>
          <button
            type="button"
            onClick={() => {
              setTab("following");
              setOpen(true);
            }}
            className="transition-opacity hover:opacity-70"
          >
            <span className="font-semibold">{formatCount(following.length)}</span>{" "}
            <span className="text-muted-foreground">abonnements</span>
          </button>
        </li>
      </ul>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[85dvh] max-w-sm flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="shrink-0 border-b border-border px-4 py-3">
            <DialogTitle className="text-center text-base font-semibold">{title}</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
            {list.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                {tab === "followers"
                  ? "Aucun abonné pour le moment."
                  : "Aucun abonnement pour le moment."}
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {list.map((p) => (
                  <li key={p.username}>
                    <Link
                      href={`/users/${p.username}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-md p-2.5 transition-colors hover:bg-muted"
                    >
                      <UserAvatar username={p.username} src={p.avatarUrl} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{p.username}</p>
                        {p.bio && <p className="truncate text-xs text-muted-foreground">{p.bio}</p>}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}