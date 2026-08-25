"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, Plus, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { createRecipe, type RecipeState } from "@/actions/recipes";
import { compressImageClient } from "@/lib/compress-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES } from "@/lib/validation";

const initialState: RecipeState = {};

export function RecipeForm() {
  const [state, formAction, pending] = useActionState(createRecipe, initialState);

  const [imageUrl, setImageUrl] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [ingredients, setIngredients] = useState<string[]>([""]);
  const [steps, setSteps] = useState<string[]>([""]);

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

  function updateRow(list: string[], setList: (v: string[]) => void, index: number, value: string) {
    const next = [...list];
    next[index] = value;
    setList(next);
  }

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div>
        <Label className="mb-2">Photo de la recette</Label>
        <input type="hidden" name="imageUrl" value={imageUrl} />
        <label className="group relative block aspect-square w-full cursor-pointer overflow-hidden rounded-xl border border-dashed border-border bg-muted">
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" onChange={handleFile} className="sr-only" />
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
        <p className="mt-1 text-xs text-muted-foreground">
          JPG, PNG, WebP, GIF ou AVIF — compressée automatiquement (moins de 1 Mo).
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Titre</Label>
        <Input id="title" name="title" placeholder="Ex. Lasagnes de ma grand-mère" maxLength={120} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Ce qui rend cette recette spéciale…"
          rows={3}
          maxLength={500}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field label="Catégorie">
          <Select name="category" defaultValue="Plat">
            <SelectTrigger>
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Préparation (min)">
          <Input type="number" name="prepTime" min={0} max={600} placeholder="15" />
        </Field>
        <Field label="Cuisson (min)">
          <Input type="number" name="cookTime" min={0} max={1440} placeholder="30" />
        </Field>
        <Field label="Portions">
          <Input type="number" name="servings" min={1} max={100} placeholder="4" />
        </Field>
      </div>

      <div className="space-y-3">
        <Label>Ingrédients</Label>
        {ingredients.map((ing, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              name="ingredient"
              value={ing}
              onChange={(e) => updateRow(ingredients, setIngredients, i, e.target.value)}
              placeholder={`Ingrédient ${i + 1}`}
              required
            />
            {ingredients.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 shrink-0 text-destructive"
                onClick={() => setIngredients(ingredients.filter((_, idx) => idx !== i))}
                aria-label="Supprimer l'ingrédient"
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIngredients((prev) => [...prev, ""])}
        >
          <Plus className="mr-1 size-4" /> Ajouter un ingrédient
        </Button>
      </div>

      <div className="space-y-3">
        <Label>Étapes</Label>
        {steps.map((step, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="mt-2.5 size-6 shrink-0 text-center text-sm font-bold text-primary">{i + 1}</span>
            <Textarea
              name="step"
              value={step}
              onChange={(e) => updateRow(steps, setSteps, i, e.target.value)}
              placeholder={`Étape ${i + 1}`}
              rows={2}
              required
            />
            {steps.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mt-1 size-9 shrink-0 text-destructive"
                onClick={() => setSteps(steps.filter((_, idx) => idx !== i))}
                aria-label="Supprimer l'étape"
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setSteps((prev) => [...prev, ""])}
        >
          <Plus className="mr-1 size-4" /> Ajouter une étape
        </Button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost">
          <Link href="/">Annuler</Link>
        </Button>
        <Button type="submit" disabled={pending || uploading || !imageUrl} className="min-w-36 rounded-full">
          {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Publier
        </Button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}