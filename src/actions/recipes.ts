"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { recipeSchema } from "@/lib/validation";
import { BLOCKED_CONTENT_MESSAGE, hasBlockedContent } from "@/lib/moderation";
import { removeImageIfSupabase } from "@/lib/supabase";

export type RecipeState = { error?: string };

function firstError(parsed: { error?: { issues?: { message: string }[] } }) {
  return parsed.error?.issues?.[0]?.message ?? "Formulaire invalide";
}

const SUSPENDED_MESSAGE = "Ton compte est suspendu. Contacte un administrateur.";

export async function createRecipe(_prev: RecipeState, formData: FormData): Promise<RecipeState> {
  const session = await getSession();
  if (!session.userId) return { error: "Connecte-toi pour publier une recette" };

  const me = await prisma.user.findUnique({ where: { id: session.userId }, select: { id: true, suspended: true } });
  if (!me) return { error: "Compte introuvable" };
  if (me.suspended) return { error: SUSPENDED_MESSAGE };

  const parseList = (key: string) =>
    formData
      .getAll(key)
      .map((v) => String(v).trim())
      .filter((v) => v.length > 0);

  const parsed = recipeSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || "",
    imageUrl: formData.get("imageUrl"),
    ingredients: parseList("ingredient"),
    steps: parseList("step"),
    prepTime: formData.get("prepTime") || undefined,
    cookTime: formData.get("cookTime") || undefined,
    servings: formData.get("servings") || undefined,
    category: formData.get("category") || "Plat",
  });

  if (!parsed.success) return { error: firstError(parsed) };

  if (hasBlockedContent(parsed.data.title) || hasBlockedContent(parsed.data.description ?? "")) {
    return { error: BLOCKED_CONTENT_MESSAGE };
  }

  const data = parsed.data;
  const recipe = await prisma.recipe.create({
    data: {
      authorId: session.userId,
      title: data.title,
      description: data.description || null,
      imageUrl: data.imageUrl,
      ingredients: data.ingredients,
      steps: data.steps,
      prepTime: data.prepTime ?? null,
      cookTime: data.cookTime ?? null,
      servings: data.servings ?? null,
      category: data.category,
    },
  });

  redirect(`/recipes/${recipe.id}`);
}

export async function publishAiRecipe(
  aiRecipeId: string,
  _prev: RecipeState,
  formData: FormData
): Promise<RecipeState> {
  const session = await getSession();
  if (!session.userId) return { error: "Connecte-toi pour publier une recette" };

  const me = await prisma.user.findUnique({ where: { id: session.userId }, select: { id: true, suspended: true } });
  if (!me) return { error: "Compte introuvable" };
  if (me.suspended) return { error: SUSPENDED_MESSAGE };

  const aiRecipe = await prisma.aiRecipe.findUnique({
    where: { id: aiRecipeId },
    select: {
      userId: true,
      title: true,
      ingredients: true,
      steps: true,
      prepTime: true,
      cookTime: true,
      servings: true,
      category: true,
    },
  });
  if (!aiRecipe || aiRecipe.userId !== session.userId) {
    return { error: "Recette générée introuvable" };
  }

  const parsed = recipeSchema.safeParse({
    title: aiRecipe.title,
    description: formData.get("description"),
    imageUrl: formData.get("imageUrl"),
    ingredients: aiRecipe.ingredients,
    steps: aiRecipe.steps,
    prepTime: aiRecipe.prepTime ?? undefined,
    cookTime: aiRecipe.cookTime ?? undefined,
    servings: aiRecipe.servings ?? undefined,
    category: aiRecipe.category,
  });

  if (!parsed.success) return { error: firstError(parsed) };

  if (hasBlockedContent(parsed.data.title) || hasBlockedContent(parsed.data.description ?? "")) {
    return { error: BLOCKED_CONTENT_MESSAGE };
  }

  const data = parsed.data;
  const [recipe] = await prisma.$transaction([
    prisma.recipe.create({
      data: {
        authorId: session.userId,
        title: data.title,
        description: data.description || null,
        imageUrl: data.imageUrl,
        ingredients: data.ingredients,
        steps: data.steps,
        prepTime: data.prepTime ?? null,
        cookTime: data.cookTime ?? null,
        servings: data.servings ?? null,
        category: data.category,
      },
    }),
    prisma.aiRecipe.delete({ where: { id: aiRecipeId } }),
  ]);

  redirect(`/recipes/${recipe.id}`);
}

export async function deleteAiRecipe(aiRecipeId: string): Promise<{ ok: true } | { error: string }> {
  const session = await getSession();
  if (!session.userId) return { error: "Non connecté" };

  const aiRecipe = await prisma.aiRecipe.findUnique({ where: { id: aiRecipeId }, select: { userId: true } });
  if (!aiRecipe || aiRecipe.userId !== session.userId) return { error: "Recette introuvable" };

  await prisma.aiRecipe.delete({ where: { id: aiRecipeId } });
  return { ok: true };
}

export async function deleteRecipe(recipeId: string): Promise<{ ok: true } | { error: string }> {
  const session = await getSession();
  if (!session.userId) return { error: "Connecte-toi pour supprimer une recette" };

  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    select: { authorId: true, imageUrl: true },
  });
  if (!recipe) return { error: "Recette introuvable" };
  if (recipe.authorId !== session.userId)
    return { error: "Tu ne peux supprimer que tes propres recettes" };

  await prisma.recipe.delete({ where: { id: recipeId } });

  await removeImageIfSupabase(recipe.imageUrl);

  const me = await prisma.user.findUnique({ where: { id: session.userId }, select: { username: true } });
  revalidatePath("/");
  revalidatePath("/explore");
  revalidatePath(`/users/${me?.username ?? "moi"}`);
  return { ok: true };
}