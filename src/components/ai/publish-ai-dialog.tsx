"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { publishAiRecipe, type RecipeState } from "@/actions/recipes";
import { compressImageClient } from "@/lib/compress-image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AiGenerated } from "@/components/ai/ai-generator";

const initialState: RecipeState = {};

type Props = {
  recipe: AiGenerated;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PublishAiDialog({ recipe, open, onOpenChange }: Props) {
  const [state, formAction, pending] = useActionState(
    publishAiRecipe.bind(null, recipe.id),
    initialState
  );

  const [imageUrl, setImageUrl] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"].includes(file.type)) {
      toast.error("Format non supporté (JPG, PNG, WebP, GIF, AVIF)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image trop lourde (max 5 Mo)");
      return;
    }

    setPreview(URL.createObjectURL(file));
    setUploading(true);
    const form = new FormData();
    const { blob, name } = await compressImageClient(file, 1600);
    form.append("file", blob instanceof File ? blob : new File([blob], name, { type: blob.type }));
    form.append("kind", "recipe");

    try {
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload échoué");
      setImageUrl(data.url);
      toast.success("Image envoyée !");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload échoué");
      setPreview(null);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajouter à mon profil</DialogTitle>
          <DialogDescription>
            Personnalise « {recipe.title} » avec ta photo et ta touche perso avant de la publier.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          {recipe.prepTime !== null && (
            <span className="text-xs text-muted-foreground">Préparation {recipe.prepTime} min</span>
          )}
          {recipe.cookTime !== null && (
            <span className="text-xs text-muted-foreground">Cuisson {recipe.cookTime} min</span>
          )}
          {recipe.servings !== null && (
            <span className="text-xs text-muted-foreground">
              {recipe.servings} portion{recipe.servings > 1 ? "s" : ""}
            </span>
          )}
        </div>

        <form action={formAction} className="space-y-4">
          {state.error && (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}

          <div>
            <Label className="mb-2">Photo du plat (obligatoire)</Label>
            <input type="hidden" name="imageUrl" value={imageUrl} />
            <label className="group relative block aspect-[16/9] w-full cursor-pointer overflow-hidden rounded-xl border border-dashed border-border bg-muted">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                onChange={handleFile}
                className="sr-only"
              />
              {preview ? (
                <>
                  <Image src={preview} alt="Aperçu" fill className="object-cover" sizes="600px" />
                  <span className="absolute inset-0 grid place-items-center bg-black/0 transition-colors group-hover:bg-black/30">
                    {uploading ? (
                      <Loader2 className="size-8 animate-spin text-white" />
                    ) : (
                      <span className="flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-sm font-medium text-foreground opacity-0 transition-opacity group-hover:opacity-100">
                        <UploadCloud className="size-4" /> Changer
                      </span>
                    )}
                  </span>
                </>
              ) : (
                <span className="absolute inset-0 grid place-items-center text-muted-foreground">
                  {uploading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="size-5 animate-spin" /> Envoi…
                    </span>
                  ) : (
                    <span className="flex flex-col items-center gap-2 text-sm">
                      <UploadCloud className="size-8" />
                      Clique pour ajouter une photo
                    </span>
                  )}
                </span>
              )}
            </label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ai-description">Ta description (obligatoire)</Label>
            <Textarea
              id="ai-description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Pourquoi tu veux cuisiner ce plat, tes astuces, tes variantes…"
              rows={3}
              maxLength={500}
              required
            />
            <p className="text-right text-xs text-muted-foreground">{description.length}/500</p>
          </div>

          <details className="rounded-lg border border-border px-3 py-2 text-sm">
            <summary className="cursor-pointer font-medium">Voir la recette générée</summary>
            <ul className="mt-2 list-inside list-disc space-y-0.5 text-muted-foreground">
              {recipe.ingredients.map((ing, i) => (
                <li key={i}>{ing}</li>
              ))}
            </ul>
          </details>

          <Button
            type="submit"
            disabled={pending || uploading || !imageUrl || description.trim().length === 0}
            className="w-full rounded-full"
          >
            {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Publier sur mon profil
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
