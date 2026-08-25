"use client";

import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSave } from "@/hooks/use-save";

type Props = {
  recipeId: string;
  initialSaved: boolean;
  size?: "sm" | "md";
  className?: string;
};

export function SaveButton({ recipeId, initialSaved, size = "md", className }: Props) {
  const { saved, pending, toggle } = useSave(recipeId, initialSaved);

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-label={saved ? "Retirer des recettes enregistrées" : "Enregistrer la recette"}
      aria-pressed={saved}
      className={cn("rounded-full p-1 transition-transform active:scale-90", className)}
    >
      <Bookmark
        className={cn(
          size === "md" ? "size-7" : "size-6",
          "transition-colors duration-200",
          saved && "fill-primary text-primary"
        )}
      />
    </button>
  );
}