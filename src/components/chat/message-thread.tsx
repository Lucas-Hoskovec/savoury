"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Flag, ImagePlus, Loader2, MoreVertical, Pencil, Send, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { deleteMessage, sendMessage, updateMessage, type MessageResult } from "@/actions/messages";
import { compressImageClient } from "@/lib/compress-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ReportDialog } from "@/components/moderation/report-dialog";
import { ImageLightbox } from "@/components/chat/image-lightbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type Props = {
  otherUsername: string;
  myId: string;
  initialMessages: MessageResult[];
};

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const MAX_SIZE = 5 * 1024 * 1024;
const CHAT_IMAGE_MAX_DIM = 1200;

export function MessageThread({ otherUsername, myId, initialMessages }: Props) {
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  useEffect(() => {
    if (!lightboxUrl) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxUrl(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxUrl]);

  async function handleSubmit(e: React.FormEvent) {    e.preventDefault();
    const text = body.trim();
    if ((!text && !imageUrl) || pending || imageUploading) return;
    setPending(true);
    const res = await sendMessage(otherUsername, text, imageUrl);
    setPending(false);
    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    setMessages((prev) => [...prev, res.message]);
    setBody("");
    setImageUrl(null);
    setImagePreview(null);
  }

  function startEdit(message: MessageResult) {
    setEditingId(message.id);
    setEditBody(message.body);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditBody("");
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId || busyId) return;
    const text = editBody.trim();
    if (!text) return;
    setBusyId(editingId);
    const res = await updateMessage(editingId, text);
    setBusyId(null);
    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    setMessages((prev) => prev.map((m) => (m.id === res.message.id ? res.message : m)));
    cancelEdit();
  }

  async function handleDelete(message: MessageResult) {
    if (!window.confirm("Supprimer ce message ?")) return;
    setBusyId(message.id);
    const res = await deleteMessage(message.id);
    setBusyId(null);
    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    setMessages((prev) => prev.filter((m) => m.id !== message.id));
    if (editingId === message.id) cancelEdit();
  }

  async function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
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

    setImageUploading(true);
    try {
      const { blob, name } = await compressImageClient(file, CHAT_IMAGE_MAX_DIM);
      const form = new FormData();
      form.append("file", blob instanceof File ? blob : new File([blob], name, { type: blob.type }));
      form.append("kind", "chat");
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload échoué");
      setImageUrl(data.url);
      setImagePreview(URL.createObjectURL(blob));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload échoué");
    } finally {
      setImageUploading(false);
    }
  }

  function removeImage() {
    setImageUrl(null);
    setImagePreview(null);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-center text-sm text-muted-foreground">
              Aucun message pour le moment.
              <br />
              Envoyez le premier message à <span className="font-semibold">@{otherUsername}</span>.
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === myId;
            const editing = editingId === m.id;
            return (
              <div
                key={m.id}
                className={cn(
                  "group flex max-w-[85%] flex-col gap-1",
                  mine ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                {editing ? (
                  <form
                    onSubmit={handleSaveEdit}
                    className={cn("flex flex-col gap-2 rounded-2xl bg-muted p-2", mine && "items-end")}
                  >
                    <Textarea
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      autoFocus
                      rows={2}
                      maxLength={2000}
                      className="min-h-10 resize-none border-0 bg-transparent focus-visible:ring-0"
                    />
                    <div className="flex items-center gap-2">
                      <Button type="button" size="sm" variant="ghost" onClick={cancelEdit}>
                        Annuler
                      </Button>
                      <Button type="submit" size="sm" disabled={!editBody.trim() || busyId === m.id}>
                        {busyId === m.id && <Loader2 className="mr-1 size-3.5 animate-spin" />}
                        Enregistrer
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className={cn("flex items-start gap-1", mine ? "flex-row-reverse" : "flex-row")}>
                    <div
                      className={cn(
                        "rounded-2xl px-3 py-2 text-sm leading-relaxed",
                        mine
                          ? "rounded-br-sm bg-primary text-primary-foreground"
                          : "rounded-bl-sm bg-muted"
                      )}
                    >
                      {m.imageUrl && (
                        <button
                          type="button"
                          onClick={() => setLightboxUrl(m.imageUrl!)}
                          aria-label="Agrandir l'image"
                          className="relative mb-1.5 block aspect-square w-44 overflow-hidden rounded-xl bg-black/10 transition-transform hover:scale-[1.02]"
                        >
                          <Image
                            src={m.imageUrl}
                            alt="Image du message"
                            fill
                            className="object-cover"
                            sizes="176px"
                          />
                        </button>
                      )}
                      <p>{m.body}</p>
                      {m.editedAt && (
                        <span className={cn("mt-0.5 block text-[10px]", mine ? "text-primary-foreground/70" : "text-muted-foreground/70")}>
                          (modifié)
                        </span>
                      )}
                    </div>
                    {mine ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            aria-label="Options du message"
                            className="mt-1 grid size-6 shrink-0 place-items-center rounded-full text-muted-foreground/50 opacity-0 transition-opacity hover:bg-muted hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
                          >
                            <MoreVertical className="size-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onSelect={() => startEdit(m)}>
                            <Pencil className="mr-2 size-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onSelect={(e) => {
                              e.preventDefault();
                              handleDelete(m);
                            }}
                          >
                            <Trash2 className="mr-2 size-4" />
                            Supprimer
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setReportingId(m.id)}>
                            <Flag className="mr-2 size-4" />
                            Signaler
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            aria-label="Options du message"
                            className="mt-1 grid size-6 shrink-0 place-items-center rounded-full text-muted-foreground/50 opacity-0 transition-opacity hover:bg-muted hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
                          >
                            <MoreVertical className="size-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-40">
                          <DropdownMenuItem onSelect={() => setReportingId(m.id)}>
                            <Flag className="mr-2 size-4" />
                            Signaler
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-border p-3">
        <input
          ref={imageInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          className="sr-only"
          onChange={handleImage}
        />
        {imagePreview ? (
          <div className="relative shrink-0">
            <Image
              src={imagePreview}
              alt="Aperçu de l'image"
              width={64}
              height={64}
              className="size-16 rounded-xl object-cover"
            />
            <button
              type="button"
              onClick={removeImage}
              aria-label="Retirer l'image"
              className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-foreground text-background shadow-sm"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ) : (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-10 shrink-0 rounded-full"
            disabled={imageUploading}
            onClick={() => imageInputRef.current?.click()}
            aria-label="Envoyer une image"
          >
            {imageUploading ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
          </Button>
        )}
        <Input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={imageUrl ? "Ajouter une légende…" : `Message @${otherUsername}…`}
          className="flex-1 rounded-full"
          maxLength={2000}
        />
        <Button
          type="submit"
          size="icon"
          className="size-10 shrink-0 rounded-full"
          disabled={(!body.trim() && !imageUrl) || pending || imageUploading}
          aria-label="Envoyer le message"
        >
          <Send className="size-4" />
        </Button>
      </form>

      <ReportDialog
        open={reportingId !== null}
        onOpenChange={(value) => {
          if (!value) setReportingId(null);
        }}
        type="message"
        targetId={reportingId ?? ""}
        className="hidden"
      />

      {lightboxUrl && (
        <ImageLightbox src={lightboxUrl} alt="Image du message" onClose={() => setLightboxUrl(null)} />
      )}
    </div>
  );
}
