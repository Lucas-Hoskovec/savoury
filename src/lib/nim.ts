import { CATEGORIES } from "@/lib/validation";

const BASE_URL = process.env.NIM_BASE_URL ?? "https://integrate.api.nvidia.com/v1";
const MODEL = process.env.NIM_MODEL ?? "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning";

/** Rythme conservateur pour rester sous la limite du tier gratuit (~40 req/min). */
const MIN_INTERVAL_MS = 1600;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const limiter = (() => {
  let tail: Promise<unknown> = Promise.resolve();
  let lastCall = 0;
  return {
    schedule<T>(fn: () => Promise<T>): Promise<T> {
      const run = tail.then(async () => {
        const wait = lastCall + MIN_INTERVAL_MS - Date.now();
        if (wait > 0) await sleep(wait);
        lastCall = Date.now();
        return fn();
      });
      tail = run.catch(() => undefined);
      return run;
    },
  };
})();

/** Extrait le premier objet JSON équilibré d'une réponse de modèle (tolère les fences ```json). */
function extractJson(text: string): string {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "");
  let depth = 0;
  let inString = false;
  let start = -1;
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (inString) {
      if (ch === "\\") {
        i += 1;
        continue;
      }
      if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{") {
      if (depth === 0) start = i;
      depth += 1;
    } else if (ch === "}") {
      depth -= 1;
      if (depth === 0 && start !== -1) {
        return cleaned.slice(start, i + 1);
      }
    }
  }
  throw new Error("Aucun objet JSON trouvé dans la réponse du modèle");
}

type ChatMessage = { role: "system" | "user"; content: string };

async function chatCompletion(
  messages: ChatMessage[],
  temperature: number,
  maxTokens: number,
  jsonObject = false,
): Promise<string> {
  const apiKey = process.env.NIM_API_KEY;
  if (!apiKey) throw new Error("NIM_API_KEY manquante");

  let attempt = 0;
  const maxAttempts = 4;
  for (;;) {
    try {
      const res = await fetch(`${BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: MODEL,
          temperature,
          max_tokens: maxTokens,
          messages,
          ...(jsonObject ? { response_format: { type: "json_object" } } : {}),
          chat_template_kwargs: { enable_thinking: false },
        }),
      });

      if (res.status === 429 && attempt < maxAttempts) {
        const retryAfter = Number(res.headers.get("retry-after")) || 2 ** attempt;
        attempt += 1;
        console.warn(`[nim] 429 rate limit, retry ${attempt}/${maxAttempts} dans ${retryAfter}s`);
        await sleep(retryAfter * 1000);
        continue;
      }
      if (!res.ok) throw new Error(`Requête NIM échouée (${res.status})`);

      const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error("Réponse vide du modèle");
      return content;
    } catch (err) {
      if (attempt < maxAttempts) {
        attempt += 1;
        console.warn(`[nim] erreur (${err instanceof Error ? err.message : "inconnue"}), retry ${attempt}/${maxAttempts} dans ${2 ** attempt}s`);
        await sleep(2 ** attempt * 1000);
        continue;
      }
      throw err;
    }
  }
}

export type GeneratedRecipe = {
  title: string;
  description: string;
  ingredients: string[];
  steps: string[];
  prepTime: number | null;
  cookTime: number | null;
  servings: number | null;
  category: string;
};

const SYSTEM_PROMPT = `Tu es Savoury AI, un chef cuisinier d'élite qui rédige des recettes réellement réalisables et délicieuses, en français.

Pense saveur d'abord, puis technique, puis structure :
- Choisis le mode de cuisson adapté au plat (saisir, braiser, rôtir, mijoter, cuire à la vapeur, sauter...).
- Équilibre les saveurs : gras (protéines, beurre, crème, huile d'olive), acide (citron, vinaigre, vin), sel/umami (bouillon, sauce soja, parmesan, miso), et piquant (piment, poivre) selon la cuisine.
- Chaque ingrédient doit avoir une utilité et une quantité précise (grammes, ml, "1 gros", "une pincée").
- Les étapes suivent le vrai déroulé en cuisine (préparation -> cuisson -> finition), une action par étape, et permettent de réaliser complètement le plat. Inclus des repères techniques : niveau de chaleur, couleur/cuisson, durée.
- Les étapes et les ingrédients correspondent parfaitement : aucun ingrédient utilisé sans être listé, aucun oublié.

Respond with ONLY a JSON object, no markdown, matching exactly:
{
  "title": "nom appétissant du plat",
  "description": "2 à 3 phrases alléchantes qui donnent envie de cuisiner ce plat",
  "ingredients": ["200 g de farine", "2 œufs", "..."],
  "steps": ["étape 1", "étape 2", "..."],
  "prepTime": 15,
  "cookTime": 30,
  "servings": 4,
  "category": "une catégorie exacte parmi : ${CATEGORIES.join(", ")}"
}
Règles :
- 6 à 14 ingrédients avec quantités, 5 à 10 étapes.
- prepTime = temps de préparation seule (épluchage, découpe, assemblage) en minutes, nombre entier.
- cookTime = temps de cuisson/repos/réfrigération en minutes, nombre entier (0 si le plat ne nécessite aucune cuisson).
- servings = nombre entier de portions.
- La catégorie doit être exactement une des valeurs proposées, la plus pertinente.
- Réfléchis silencieusement. Réponds UNIQUEMENT avec l'objet JSON, commençant par { et finissant par }. Aucun raisonnement, aucune explication.`;

function safeString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** Tolère les entiers et les chaînes comme "45" ou "45 min". */
function safeDuration(value: unknown, max: number): number | null {
  const match = String(value ?? "").match(/\d+/);
  if (!match) return null;
  const n = Number(match[0]);
  return n >= 0 && n <= max ? n : null;
}

function safeArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter((v) => v.length > 0)
    .slice(0, 30);
}

export async function generateRecipeFromPrompt(prompt: string): Promise<GeneratedRecipe> {
  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `Demande de l'utilisateur : ${prompt}` },
  ];

  // 2 tentatives : le modèle peut renvoyer un JSON tronqué/invalide de temps en temps.
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const content = await limiter.schedule(() =>
        chatCompletion(messages, 0.4, 8192, true)
      );
      console.warn("[nim] brut:", content.slice(-300));
      const raw = JSON.parse(extractJson(content)) as Record<string, unknown>;
      return buildRecipe(raw);
    } catch (err) {
      lastError = err;
      console.warn(`[nim] tentative ${attempt + 1}/2 échouée:`, err instanceof Error ? err.message : err);
    }
  }
  throw lastError;
}

function buildRecipe(raw: Record<string, unknown>): GeneratedRecipe {
  const title = safeString(raw.title);
  const ingredients = safeArray(raw.ingredients);
  const steps = safeArray(raw.steps);
  if (!title || ingredients.length === 0 || steps.length === 0) {
    throw new Error("Recette incomplète renvoyée par le modèle");
  }

  const category = safeString(raw.category);

  return {
    title,
    description: safeString(raw.description) ?? "",
    ingredients,
    steps,
    prepTime: safeDuration(raw.prepTime, 600),
    cookTime: safeDuration(raw.cookTime, 1440),
    servings: safeDuration(raw.servings, 100),
    category: category && (CATEGORIES as readonly string[]).includes(category) ? category : "Plat",
  };
}
