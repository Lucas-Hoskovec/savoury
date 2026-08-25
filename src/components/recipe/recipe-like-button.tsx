"use client";

import { LikeButton } from "@/components/feed/like-button";
import { useLike } from "@/hooks/use-like";

type Props = {
  recipeId: string;
  initialLiked: boolean;
  initialCount: number;
};

export function RecipeLikeButton({ recipeId, initialLiked, initialCount }: Props) {
  const { liked, count, pending, toggle } = useLike(recipeId, initialLiked, initialCount);
  return <LikeButton liked={liked} count={count} onToggle={toggle} pending={pending} />;
}