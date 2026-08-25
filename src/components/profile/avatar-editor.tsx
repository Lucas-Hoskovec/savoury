"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { updateAvatar } from "@/actions/profile";
import { compressImageClient } from "@/lib/compress-image";
import { UserAvatar } from "@/components/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const MAX_SIZE = 5 * 1024 * 1024;

type Props = {
  username: string;
  initialAvatarUrl: string | null;
};

export function AvatarEditor({ username, initialAvatarUrl }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Format non supporté (JPG, PNG, WebP, GIF, AVIF)");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("Image trop lourde (max 5 Mo)");
      return;
    }

    setUploading(true);
    const form = new FormData();
    const { blob, name } = await compressImageClient(file, 512);
    form.append("file", blob instanceof File ? blob : new File([blob], name, { type: blob.type }));
    form.append("kind", "avatar");

    try {
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload échoué");

      const upd = await updateAvatar(data.url);
      if ("error" in upd) throw new Error(upd.error);

      setAvatarUrl(data.url);
      toast.success("Photo de profil mise à jour");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload échoué");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    if (!window.confirm("Supprimer ta photo de profil ?")) return;
    const res = await updateAvatar(null);
    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    setAvatarUrl(null);
    toast.success("Photo de profil supprimée");
  }

  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Modifier la photo de profil"
            className="relative block rounded-full transition-opacity hover:opacity-90"
          >
            <UserAvatar username={username} src={avatarUrl} size="xl" />
            {uploading && (
              <span className="absolute inset-0 grid place-items-center rounded-full bg-black/40">
                <Loader2 className="size-6 animate-spin text-white" />
              </span>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuItem onSelect={() => inputRef.current?.click()}>
            <Camera className="mr-2 size-4" />
            Changer de photo de profil
          </DropdownMenuItem>
          {avatarUrl && (
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={(e) => {
                e.preventDefault();
                handleRemove();
              }}
            >
              <Trash2 className="mr-2 size-4" />
              Supprimer la photo
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        className="sr-only"
        onChange={handleFile}
      />
    </div>
  );
}
