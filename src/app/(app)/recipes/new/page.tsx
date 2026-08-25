import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { RecipeForm } from "@/components/recipe/recipe-form";

export default async function NewRecipePage() {
  const session = await getSession();
  if (!session.userId) redirect("/login?next=/recipes/new");

  return (
    <div className="mx-auto max-w-[600px] px-4 py-6">
      <h1 className="mb-1 font-display text-2xl font-bold">Partager une recette</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Publie ta création pour faire saliver ta communauté.
      </p>
      <RecipeForm />
    </div>
  );
}