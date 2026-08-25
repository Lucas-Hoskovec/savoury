"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteRecipe } from "@/actions/recipes";

type Props = {
  recipeId: string;
  username: string;
  variant?: "icon" | "overlay";
};

export function DeleteRecipeButton({ recipeId, username, variant = "icon" }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Supprimer cette recette ? Cette action est définitive.")) return;
    startTransition(async () => {
      const res = await deleteRecipe(recipeId);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Recette supprimée");
      router.push(`/users/${username}`);
    });
  }

  if (variant === "overlay") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-label="Supprimer la recette"
        className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-destructive/90"
      >
        <Trash2 className="size-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label="Supprimer la recette"
      className="rounded-full p-1.5 text-muted-foreground transition-colors hover:text-destructive"
    >
      <Trash2 className="size-6" />
    </button>
  );
}