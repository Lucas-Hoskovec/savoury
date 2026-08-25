"use client";

import { useEffect, useRef } from "react";
import { recordRecipeView } from "@/actions/interactions";

export function ViewTracker({ recipeId }: { recipeId: string }) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    void recordRecipeView(recipeId);
  }, [recipeId]);

  return null;
}