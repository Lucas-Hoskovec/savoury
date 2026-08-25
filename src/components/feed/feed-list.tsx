"use client";

import { useEffect, useRef, useState } from "react";
import { RecipeCard } from "@/components/feed/recipe-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { FeedItem, FeedPage } from "@/lib/feed-types";

type Props = {
  initialItems: FeedItem[];
  initialOffset: number | null;
};

export function FeedList({ initialItems, initialOffset }: Props) {
  const [items, setItems] = useState<FeedItem[]>(initialItems);
  const [offset, setOffset] = useState<number | null>(initialOffset);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        if (!entries[0].isIntersecting || loading || offset === null) return;
        setLoading(true);
        try {
          const res = await fetch(`/api/feed?offset=${offset}`);
          const data: FeedPage = await res.json();
          setItems((prev) => [...prev, ...data.items]);
          setOffset(data.nextOffset);
        } catch {
          // silencieux : retentera au prochain scroll
        } finally {
          setLoading(false);
        }
      },
      { rootMargin: "600px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [offset, loading]);

  return (
    <div className="space-y-6">
      {items.map((item) => (
        <RecipeCard key={item.id} item={item} />
      ))}
      {loading &&
        Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3 p-3">
              <Skeleton className="size-8 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-2.5 w-16" />
              </div>
            </div>
            <Skeleton className="aspect-square w-full rounded-none" />
            <div className="space-y-3 p-3">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      <div ref={sentinelRef} className="h-px" />
    </div>
  );
}