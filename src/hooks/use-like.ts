"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { toggleLike } from "@/actions/interactions";

export function useLike(recipeId: string, initialLiked: boolean, initialCount: number) {
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, startTransition] = useTransition();

  function toggle() {
    if (pending) return;
    const next = !liked;
    setLiked(next);
    setCount((c) => c + (next ? 1 : -1));
    startTransition(async () => {
      const res = await toggleLike(recipeId);
      if ("error" in res) {
        setLiked(!next);
        setCount((c) => c + (next ? -1 : 1));
        toast.error(res.error);
        if (res.error === "Connecte-toi pour aimer") router.push("/login");
      } else {
        setLiked(res.liked);
        setCount(res.count);
      }
    });
  }

  return { liked, count, pending, toggle };
}