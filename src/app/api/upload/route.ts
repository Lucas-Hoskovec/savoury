import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { compressImage, type CompressedImage } from "@/lib/image-compress";
import { prisma } from "@/lib/prisma";
import {
  publicImageUrl,
  SUPABASE_AVATAR_BUCKET,
  SUPABASE_BUCKET,
  SUPABASE_CHAT_BUCKET,
  supabaseServer,
} from "@/lib/supabase";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 Mo

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const me = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { suspended: true },
  });
  if (me?.suspended) {
    return NextResponse.json({ error: "Ton compte est suspendu" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  const rawKind = formData.get("kind");
  const kind: "avatar" | "recipe" | "chat" =
    rawKind === "avatar" ? "avatar" : rawKind === "chat" ? "chat" : "recipe";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Format non supporté (JPG, PNG, WebP, GIF, AVIF)" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Image trop lourde (max 5 Mo)" }, { status: 400 });
  }

  let processed: CompressedImage;
  try {
    processed = await compressImage(Buffer.from(await file.arrayBuffer()), kind, file.type);
  } catch {
    return NextResponse.json({ error: "Image illisible" }, { status: 400 });
  }

  const path =
    kind === "avatar"
      ? `${session.userId}/avatars/${Date.now()}-${crypto.randomUUID()}.${processed.ext}`
      : kind === "chat"
        ? `${session.userId}/chat/${Date.now()}-${crypto.randomUUID()}.${processed.ext}`
        : `${session.userId}/${Date.now()}-${crypto.randomUUID()}.${processed.ext}`;
  const bucket =
    kind === "avatar" ? SUPABASE_AVATAR_BUCKET : kind === "chat" ? SUPABASE_CHAT_BUCKET : SUPABASE_BUCKET;

  const { error } = await supabaseServer()
    .storage.from(bucket)
    .upload(path, processed.buffer, { contentType: processed.mime, upsert: false });

  if (error) {
    return NextResponse.json({ error: "Échec de l'upload" }, { status: 500 });
  }

  return NextResponse.json({ url: publicImageUrl(path, bucket) });
}