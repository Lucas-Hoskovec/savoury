"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Heart, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import type { FeedItem } from "@/lib/feed-types";
import { UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";
import { LikeButton } from "@/components/feed/like-button";
import { SaveButton } from "@/components/feed/save-button";
import { useLike } from "@/hooks/use-like";
import { timeAgo } from "@/lib/format";

export function RecipeCard({ item }: { item: FeedItem }) {
  const router = useRouter();
  const { liked, count, pending, toggle } = useLike(item.id, item.liked, item.likeCount);
  const [burst, setBurst] = useState(false);
  const burstTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleDoubleTap() {
    if (liked) return;
    toggle();
    setBurst(true);
    if (burstTimer.current) clearTimeout(burstTimer.current);
    burstTimer.current = setTimeout(() => setBurst(false), 700);
  }

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/recipes/${item.id}`);
      toast.success("Lien copié !");
    } catch {
      toast.error("Impossible de copier le lien");
    }
  }

  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card">
      <header className="flex items-center gap-3 p-3">
        <Link href={`/users/${item.author.username}`} aria-label={`Profil de ${item.author.username}`}>
          <UserAvatar username={item.author.username} src={item.author.avatarUrl} />
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/users/${item.author.username}`} className="block text-sm font-semibold hover:underline">
            @{item.author.username}
          </Link>
        </div>
        <Badge variant="outline">
          {item.category}
        </Badge>
      </header>

      <div
        className="group relative aspect-square cursor-pointer overflow-hidden bg-muted"
        onDoubleClick={handleDoubleTap}
        onClick={() => router.push(`/recipes/${item.id}`)}
      >
        <Image
          src={item.imageUrl}
          alt={item.title}
          fill
          sizes="(max-width: 768px) 100vw, 630px"
          priority={false}
          className="object-cover transition-transform duration-300 group-hover:scale-[1.01]"
        />
        {burst && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <Heart className="size-24 fill-white text-white drop-shadow-lg animate-heart-pop" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 px-3 pt-3">
        <LikeButton
          liked={liked}
          count={count}
          onToggle={toggle}
          pending={pending}
          showCount={false}
        />
        <Link
          href={`/recipes/${item.id}`}
          aria-label="Commenter"
          className="rounded-full p-1 transition-transform active:scale-90"
        >
          <MessageCircle className="size-7" />
        </Link>
        <button
          type="button"
          onClick={handleShare}
          aria-label="Partager"
          className="rounded-full p-1 transition-transform active:scale-90"
        >
          <Send className="size-7" />
        </button>
        <SaveButton
          recipeId={item.id}
          initialSaved={item.saved}
          className="ml-auto"
        />
      </div>

      <div className="space-y-1 px-3 pb-3 pt-1">
        <p className="text-sm leading-snug">
          <Link href={`/users/${item.author.username}`} className="font-semibold hover:underline">
            @{item.author.username}
          </Link>{" "}
          <span className="text-muted-foreground">{item.description}</span>
        </p>
        <Link href={`/recipes/${item.id}`} className="block text-sm text-muted-foreground hover:underline">
          Voir les {item.commentCount} commentaire{item.commentCount > 1 ? "s" : ""}
        </Link>
        <p className="pt-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
          {timeAgo(item.createdAt)}
        </p>
      </div>
    </article>
  );
}