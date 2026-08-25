import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { generateRecipeFromPrompt } from "@/lib/nim";

const bodySchema = z.object({ prompt: z.string().trim().min(1, "Prompt vide").max(500) });

/** Limite en mémoire : 10 générations par utilisateur et par heure. */
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const usage = new Map<string, number[]>();

function rateLimited(userId: string): boolean {
  const now = Date.now();
  const timestamps = (usage.get(userId) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (timestamps.length >= RATE_LIMIT) {
    usage.set(userId, timestamps);
    return true;
  }
  timestamps.push(now);
  usage.set(userId, timestamps);
  return false;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Connecte-toi pour utiliser Savoury AI" }, { status: 401 });
  }

  const me = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { suspended: true },
  });
  if (me?.suspended) {
    return NextResponse.json({ error: "Ton compte est suspendu" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Prompt invalide" },
      { status: 400 }
    );
  }

  if (rateLimited(session.userId)) {
    return NextResponse.json(
      { error: "Trop de générations. Réessaie dans une heure." },
      { status: 429 }
    );
  }

  let recipe;
  try {
    recipe = await generateRecipeFromPrompt(parsed.data.prompt);
  } catch (err) {
    console.error("Savoury AI:", err);
    return NextResponse.json(
      { error: "La génération a échoué. Réessaie dans un instant." },
      { status: 502 }
    );
  }

  const saved = await prisma.aiRecipe.create({
    data: {
      userId: session.userId,
      prompt: parsed.data.prompt,
      title: recipe.title,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      servings: recipe.servings,
      category: recipe.category,
    },
  });

  return NextResponse.json({
    id: saved.id,
    title: recipe.title,
    description: recipe.description,
    ingredients: recipe.ingredients,
    steps: recipe.steps,
    prepTime: recipe.prepTime,
    cookTime: recipe.cookTime,
    servings: recipe.servings,
    category: recipe.category,
  });
}
