import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const SUPABASE_BUCKET = "recipe-images";
export const SUPABASE_AVATAR_BUCKET = "user-avatars";
export const SUPABASE_CHAT_BUCKET = "chat-images";

export function supabaseServer() {
  if (!url || !serviceKey) {
    throw new Error("Supabase URL / service role key manquants dans .env");
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

export function publicImageUrl(path: string, bucket = SUPABASE_BUCKET) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return path;
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}

export async function removeImageIfSupabase(imageUrl: string) {
  try {
    const match = imageUrl.match(/\/public\/([^/]+)\/(.+)$/);
    if (!match) return;
    const [, bucket, path] = match;
    if (!bucket || !path) return;
    await supabaseServer().storage.from(bucket).remove([path]);
  } catch {
    // best-effort (ex. image externe)
  }
}

export async function removeImagesIfSupabase(imageUrls: string[]) {
  const byBucket = new Map<string, string[]>();
  for (const imageUrl of imageUrls) {
    const match = imageUrl.match(/\/public\/([^/]+)\/(.+)$/);
    if (!match) continue;
    const [, bucket, path] = match;
    if (!bucket || !path) continue;
    const paths = byBucket.get(bucket) ?? [];
    if (!paths.includes(path)) paths.push(path);
    byBucket.set(bucket, paths);
  }
  await Promise.all(
    [...byBucket.entries()].map(async ([bucket, paths]) => {
      try {
        await supabaseServer().storage.from(bucket).remove(paths);
      } catch {
        // best-effort
      }
    })
  );
}