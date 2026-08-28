"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ChefHat,
  ChevronRight,
  Clock,
  Flame,
  ListChecks,
  Loader2,
  Mic,
  MicOff,
  RefreshCw,
  Sparkles,
  Trash2,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { deleteAiRecipe } from "@/actions/recipes";
import { useVoice } from "@/lib/voice";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PublishAiDialog } from "@/components/ai/publish-ai-dialog";

export type AiGenerated = {
  id: string;
  title: string;
  description?: string;
  ingredients: string[];
  steps: string[];
  prepTime: number | null;
  cookTime: number | null;
  servings: number | null;
  category: string;
};

export type AiHistoryItem = AiGenerated & {
  prompt: string;
  createdAt: string;
};

const GLASS =
  "bg-card/60 border border-border/50 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.07)]";

export function AiGenerator({ initialHistory }: { initialHistory: AiHistoryItem[] }) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AiGenerated | null>(null);
  const [history, setHistory] = useState<AiHistoryItem[]>(initialHistory);
  const [publishOpen, setPublishOpen] = useState(false);
  const dictationBase = useRef("");

  const voice = useVoice({
    lang: "fr-FR",
    onTranscript: (text) => {
      const base = dictationBase.current;
      setPrompt((base ? `${base} ` : "") + text);
    },
    onFinal: (text) => {
      const base = dictationBase.current;
      setPrompt((base ? `${base} ` : "") + text);
      dictationBase.current = "";
    },
  });

  async function generate(p: string) {
    if (!p.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: p.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "La génération a échoué");
      const generated: AiGenerated = {
        id: data.id,
        title: data.title,
        description: data.description,
        ingredients: data.ingredients,
        steps: data.steps,
        prepTime: data.prepTime,
        cookTime: data.cookTime,
        servings: data.servings,
        category: data.category,
      };
      setResult(generated);
      setHistory((prev) => [
        { ...generated, description: undefined, prompt: p.trim(), createdAt: new Date().toISOString() },
        ...prev.filter((h) => h.id !== generated.id),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "La génération a échoué");
    } finally {
      setLoading(false);
    }
  }

  async function removeFromHistory(id: string) {
    setHistory((prev) => prev.filter((h) => h.id !== id));
    setResult((prev) => (prev?.id === id ? null : prev));
    const res = await deleteAiRecipe(id);
    if ("error" in res) toast.error(res.error);
  }

  function loadFromHistory(item: AiHistoryItem) {
    setResult(item);
  }

  return (
    <div className="space-y-6">
      {/* Panneau de saisie */}
      <div className={cn("rounded-[1.75rem] p-2", GLASS)}>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void generate(prompt);
            }
          }}
          placeholder="Décris ton envie : un plat, des ingrédients, une humeur… (Entrée pour générer, Maj+Entrée pour un retour à la ligne)"
          rows={3}
          maxLength={500}
          aria-label="Décris la recette que tu veux"
          className="resize-none border-none bg-transparent px-4 pt-3 text-base shadow-none focus-visible:ring-0"
        />
        <div className="flex items-end justify-between gap-3 px-2 pb-1">
          <span className="pb-2 text-xs text-muted-foreground">{prompt.length}/500</span>
          <div className="flex items-center gap-2">
            {voice.isListening && (
              <span className="flex items-center gap-1 pb-2" aria-label="Dictée en cours">
                <span className="size-1.5 animate-bounce rounded-full bg-destructive [animation-delay:-0.3s]" />
                <span className="size-1.5 animate-bounce rounded-full bg-destructive [animation-delay:-0.15s]" />
                <span className="size-1.5 animate-bounce rounded-full bg-destructive" />
              </span>
            )}
            {voice.supported && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (voice.isListening) voice.stop();
                  else {
                    dictationBase.current = prompt;
                    voice.start();
                  }
                }}
                aria-label={voice.isListening ? "Arrêter la dictée" : "Dicter la requête"}
                className={cn(
                  "size-10 rounded-full",
                  voice.isListening && "animate-pulse bg-destructive/15 text-destructive hover:bg-destructive/20"
                )}
              >
                {voice.isListening ? <MicOff className="size-5" /> : <Mic className="size-5" />}
              </Button>
            )}
            <Button
              onClick={() => void generate(prompt)}
              disabled={loading || !prompt.trim()}
              size="lg"
              className="pressable rounded-full px-6"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Génération…
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 size-4" /> Générer
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <p className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {history.length > 0 && (
        <section>
          <h2 className="mb-3 px-1 text-sm font-semibold text-muted-foreground">Générations récentes</h2>
          <ul className={cn("divide-y divide-border/40 overflow-hidden rounded-[1.75rem]", GLASS)}>
            {history.map((item) => (
              <li key={item.id} className="flex items-center gap-1 pl-2 pr-1">
                <button
                  type="button"
                  onClick={() => loadFromHistory(item)}
                  className="min-w-0 flex-1 py-3 pr-2 text-left"
                >
                  <p className="truncate text-[15px] font-medium">{item.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{item.prompt}</p>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => void removeFromHistory(item.id)}
                  aria-label={`Supprimer ${item.title} de l'historique`}
                >
                  <Trash2 className="size-4" />
                </Button>
                <ChevronRight className="mr-2 size-4 shrink-0 text-muted-foreground/50" />
              </li>
            ))}
          </ul>
        </section>
      )}

      {result && (
        <>
          <AiRecipeFullscreen
            recipe={result}
            regenerating={loading}
            onClose={() => {
              setResult(null);
              setPublishOpen(false);
            }}
            onRegenerate={() => void generate(prompt || result.title)}
            onPublish={() => setPublishOpen(true)}
          />
          <PublishAiDialog recipe={result} open={publishOpen} onOpenChange={setPublishOpen} />
        </>
      )}
    </div>
  );
}

function AiRecipeFullscreen({
  recipe,
  regenerating,
  onClose,
  onRegenerate,
  onPublish,
}: {
  recipe: AiGenerated;
  regenerating: boolean;
  onClose: () => void;
  onRegenerate: () => void;
  onPublish: () => void;
}) {
  const [section, setSection] = useState<"ingredients" | "steps">("ingredients");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto overscroll-contain bg-background">
      {/* Héros */}
      <div className="relative h-[320px] min-h-[280px] w-full overflow-hidden rounded-b-[2.5rem]">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[radial-gradient(120%_120%_at_20%_0%,var(--accent)_0%,var(--primary)_55%,oklch(0.35_0.12_25)_100%)]">
          <span className="grid size-20 place-items-center rounded-full bg-white/15 backdrop-blur">
            <ChefHat className="size-10 text-white/90" strokeWidth={1.5} />
          </span>
          <span className="text-sm font-semibold uppercase tracking-widest text-white/80">
            Savoury AI · {recipe.category}
          </span>
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-black/20" />

        <button
          type="button"
          onClick={onClose}
          aria-label="Retour au générateur"
          className="pressable absolute left-4 top-4 z-10 grid size-11 place-items-center rounded-full bg-white/85 text-foreground shadow-lg backdrop-blur"
        >
          <ArrowLeft className="size-5" />
        </button>
      </div>

      {/* Contenu remonté sur le héros */}
      <div className="relative z-10 mx-auto -mt-8 max-w-2xl px-4 pb-36">
        <div className={cn("space-y-4 rounded-[1.75rem] px-5 pb-6 pt-6", GLASS)}>
          <h1 className="font-display text-[26px] font-bold leading-tight tracking-tight">
            {recipe.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            {recipe.prepTime !== null && (
              <GlassBadge>
                <Clock className="size-3.5" /> Préparation {recipe.prepTime} min
              </GlassBadge>
            )}
            {recipe.cookTime !== null && (
              <GlassBadge>
                <Flame className="size-3.5" /> Cuisson {recipe.cookTime} min
              </GlassBadge>
            )}
            {recipe.servings !== null && (
              <GlassBadge>
                <Users className="size-3.5" /> {recipe.servings} portion{recipe.servings > 1 ? "s" : ""}
              </GlassBadge>
            )}
            <GlassBadge>
              <UtensilsCrossed className="size-3.5" /> {recipe.category}
            </GlassBadge>
          </div>
          {recipe.description && (
            <p className="text-[15px] leading-relaxed text-muted-foreground">{recipe.description}</p>
          )}
        </div>

        {/* Onglets segmentés */}
        <div className={cn("mt-5 flex items-center gap-1 rounded-full p-1", GLASS)}>
          {(
            [
              { key: "ingredients", label: "Ingrédients", icon: ListChecks },
              { key: "steps", label: "Préparation", icon: UtensilsCrossed },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSection(tab.key)}
              className={cn(
                "pressable flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full text-[13px] font-semibold transition-colors",
                section === tab.key
                  ? "bg-background text-foreground shadow-[0_2px_10px_rgba(0,0,0,0.1)]"
                  : "text-muted-foreground"
              )}
            >
              <tab.icon className="size-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-5">
          {section === "ingredients" && (
            <div className={cn("rounded-[1.75rem] px-5 py-2", GLASS)}>
              <ul className="divide-y divide-border/40">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i} className="py-3 text-[15px]">
                    {ing}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {section === "steps" && (
            <ol className="space-y-3">
              {recipe.steps.map((step, i) => (
                <li key={i} className={cn("flex items-start gap-4 rounded-[1.75rem] px-5 py-4", GLASS)}>
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-secondary text-[13px] font-bold text-secondary-foreground">
                    {i + 1}
                  </span>
                  <p className="pt-0.5 text-[15px] leading-relaxed">{step}</p>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Actions */}
        <div
          className={cn(
            "fixed inset-x-0 bottom-6 z-[80] mx-auto flex max-w-[calc(100vw-32px)] items-center gap-2 rounded-full p-1.5 md:max-w-xl",
            GLASS
          )}
        >
          <Button
            variant="ghost"
            className="flex-1 rounded-full text-muted-foreground hover:text-foreground"
            onClick={onRegenerate}
            disabled={regenerating}
          >
            <RefreshCw className={cn("mr-1.5 size-4", regenerating && "animate-spin")} />
            {regenerating ? "Régénération…" : "Régénérer"}
          </Button>
          <Button className="flex-1 rounded-full" onClick={onPublish} disabled={regenerating}>
            <Sparkles className="mr-1.5 size-4" /> Ajouter à mon profil
          </Button>
        </div>
      </div>
    </div>
  );
}

function GlassBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-secondary/70 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
      {children}
    </span>
  );
}
