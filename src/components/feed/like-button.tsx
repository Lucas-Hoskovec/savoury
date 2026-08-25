"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCount } from "@/lib/format";

type Props = {
  liked: boolean;
  count: number;
  onToggle: () => void;
  pending?: boolean;
  showCount?: boolean;
  size?: "sm" | "md";
  className?: string;
};

export function LikeButton({
  liked,
  count,
  onToggle,
  pending,
  showCount = true,
  size = "md",
  className,
}: Props) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <button
        type="button"
        onClick={onToggle}
        disabled={pending}
        aria-label={liked ? "Retirer le j'aime" : "J'aime"}
        aria-pressed={liked}
        className="rounded-full p-1 transition-transform active:scale-90"
      >
        <Heart
          className={cn(
            size === "md" ? "size-7" : "size-6",
            "transition-colors duration-200",
            liked && "fill-primary text-primary animate-heart-pop"
          )}
        />
      </button>
      {showCount && <span className="text-sm font-semibold tabular-nums">{formatCount(count)}</span>}
    </div>
  );
}