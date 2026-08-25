"use client";

import { Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ShareButton({ recipeId }: { recipeId: string }) {
  const handleClick = () => {
    try {
      if (typeof navigator !== "undefined") {
        navigator.clipboard.writeText(`${window.location.origin}/recipes/${recipeId}`);
      }
      toast.success("Lien copié !");
    } catch {
      toast.error("Impossible de copier le lien");
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={handleClick}
      aria-label="Partager la recette"
      className="size-10 rounded-full"
    >
      <Send className="size-7" />
    </Button>
  );
}