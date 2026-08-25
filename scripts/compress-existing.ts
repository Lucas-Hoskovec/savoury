import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { compressImage } from "../src/lib/image-compress.ts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const prisma = new PrismaClient();

const TARGET_BYTES = 1024 * 1024;
const LIMIT = 100;

async function listAll(bucket: string, folder: string) {
  const all = [];
  for (let offset = 0; ; offset += LIMIT) {
    const { data, error } = await supabase.storage.from(bucket).list(folder, { limit: LIMIT, offset });
    if (error) throw error;
    all.push(...data);
    if (data.length < LIMIT) break;
  }
  return all;
}

function objectSize(obj: { metadata: { size?: number } | null }) {
  return obj.metadata?.size ?? 0;
}

const stats = { recipe: { checked: 0, compressed: 0, saved: 0 }, avatar: { checked: 0, compressed: 0, saved: 0 } };

async function processFile(
  bucket: string,
  path: string,
  kind: "recipe" | "avatar",
  size: number,
) {
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error || !data) {
    console.log(`  KO telechargement ${path}: ${error?.message}`);
    return;
  }
  const input = Buffer.from(await data.arrayBuffer());
  const out = await compressImage(input, kind, data.type || "image/png");
  const stat = stats[kind];
  stat.checked++;

  if (out.buffer.length >= size) {
    console.log(`  deja compact ${path}`);
    return;
  }

  const newPath = path.replace(/\.[^/.]+$/, "") + "." + out.ext;
  const { error: upErr } = await supabase.storage
    .from(bucket)
    .upload(newPath, out.buffer, { contentType: out.mime, upsert: false });
  if (upErr) {
    console.log(`  KO upload ${newPath}: ${upErr.message}`);
    return;
  }
  const { error: rmErr } = await supabase.storage.from(bucket).remove([path]);
  if (rmErr) {
    console.log(`  KO suppression ${path}: ${rmErr.message}`);
    return;
  }

  const newUrl = `${url}/storage/v1/object/public/${bucket}/${newPath}`;
  if (kind === "avatar") {
    const user = await prisma.user.findUnique({ where: { id: newPath.split("/")[0] }, select: { id: true, avatarUrl: true } });
    if (user?.avatarUrl?.includes(path)) {
      await prisma.user.update({ where: { id: user.id }, data: { avatarUrl: newUrl } });
    }
  } else {
    const recipe = await prisma.recipe.findFirst({ where: { imageUrl: { contains: path } }, select: { id: true } });
    if (recipe) {
      await prisma.recipe.update({ where: { id: recipe.id }, data: { imageUrl: newUrl } });
    }
  }

  stat.compressed++;
  stat.saved += size - out.buffer.length;
  console.log(`  ${path} -> ${newPath} (${(size / 1024).toFixed(0)} Ko -> ${(out.buffer.length / 1024).toFixed(0)} Ko)`);
}

console.log("=== user-avatars ===");
const avatarRoots = await listAll("user-avatars", "");
for (const root of avatarRoots) {
  if (root.id !== null) continue;
  const files = await listAll("user-avatars", `${root.name}/avatars`);
  for (const f of files) {
    const size = objectSize(f);
    if (size <= TARGET_BYTES) continue;
    await processFile("user-avatars", `${root.name}/avatars/${f.name}`, "avatar", size);
  }
}

console.log("=== recipe-images ===");
const recipeRoots = await listAll("recipe-images", "");
for (const root of recipeRoots) {
  if (root.id !== null) continue;
  const files = await listAll("recipe-images", root.name);
  for (const f of files) {
    if (f.id === null) continue;
    const size = objectSize(f);
    if (size <= TARGET_BYTES) continue;
    await processFile("recipe-images", `${root.name}/${f.name}`, "recipe", size);
  }
}

console.log("=== resume ===");
console.log(`avatars: ${stats.avatar.compressed}/${stats.avatar.checked} compressees, ${(stats.avatar.saved / 1024 / 1024).toFixed(2)} Mo economises`);
console.log(`recettes: ${stats.recipe.compressed}/${stats.recipe.checked} compressees, ${(stats.recipe.saved / 1024 / 1024).toFixed(2)} Mo economises`);

await prisma.$disconnect();
