import Link from "next/link";
import Image from "next/image";
import { Heart, MessageCircle } from "lucide-react";
import { DeleteRecipeButton } from "@/components/recipe/delete-recipe-button";

type Props = {
  recipe: {
    id: string;
    imageUrl: string;
    title: string;
    likeCount: number;
    commentCount: number;
  };
  canDelete?: boolean;
  username?: string;
};

export function RecipeGridCard({ recipe, canDelete = false, username }: Props) {
  return (
    <Link
      href={`/recipes/${recipe.id}`}
      aria-label={recipe.title}
      className="group relative aspect-square overflow-hidden rounded-lg bg-muted"
    >
      <Image
        src={recipe.imageUrl}
        alt={recipe.title}
        fill
        sizes="(max-width: 640px) 33vw, 293px"
        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
      />
      <div className="absolute inset-0 flex items-center justify-center gap-5 bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-white">
          <Heart className="size-5 fill-white" />
          {recipe.likeCount}
        </span>
        <span className="flex items-center gap-1.5 text-sm font-semibold text-white">
          <MessageCircle className="size-5" />
          {recipe.commentCount}
        </span>
      </div>
      {canDelete && username && <DeleteRecipeButton recipeId={recipe.id} username={username} variant="overlay" />}
    </Link>
  );
}