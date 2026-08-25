import { z } from "zod";
import { stripControlChars } from "@/lib/sanitize";

export const CATEGORIES = [
  "Entrée",
  "Plat",
  "Dessert",
  "Petit-déjeuner",
  "Végétarien",
  "Vegan",
  "Boisson",
  "Snack",
] as const;

/** Texte libre nettoyé (contrôle/invisible retirés) et borné. */
function textSchema(min: number, max: number) {
  return z
    .string()
    .transform(stripControlChars)
    .pipe(
      z
        .string()
        .min(min, min > 0 ? `Au moins ${min} caractères` : "Texte invalide")
        .max(max, `${max} caractères maximum`)
    );
}

export const registerSchema = z.object({
  username: z
    .string()
    .transform((v) => stripControlChars(v.trim()))
    .pipe(
      z
        .string()
        .min(3, "Au moins 3 caractères")
        .max(20, "20 caractères maximum")
        .regex(/^[a-zA-Z0-9_.]+$/, "Lettres, chiffres, _ et . uniquement")
    ),
  email: z.string().trim().max(254, "Email trop long").email("Email invalide"),
  password: z.string().min(8, "Au moins 8 caractères").max(72, "72 caractères maximum"),
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Requis").max(120),
  password: z.string().min(1, "Requis").max(72),
});

export const recipeSchema = z.object({
  title: textSchema(3, 120),
  description: textSchema(0, 500).optional().or(z.literal("")),
  imageUrl: z.string().url("Image requise"),
  ingredients: z
    .array(textSchema(1, 200))
    .min(1, "Au moins un ingrédient")
    .max(30, "30 ingrédients maximum"),
  steps: z.array(textSchema(1, 1000)).min(1, "Au moins une étape").max(25, "25 étapes maximum"),
  prepTime: z.coerce.number().int().min(0).max(600).optional(),
  cookTime: z.coerce.number().int().min(0).max(1440).optional(),
  servings: z.coerce.number().int().min(1).max(100).optional(),
  category: z.enum(CATEGORIES).default("Plat"),
});

export const commentSchema = z.object({
  body: textSchema(1, 1000),
});
