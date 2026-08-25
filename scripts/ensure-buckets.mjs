import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants dans .env");
  process.exit(1);
}

const BUCKETS = [
  { name: "recipe-images", public: true },
  { name: "user-avatars", public: true },
  { name: "chat-images", public: true },
];

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

for (const bucket of BUCKETS) {
  const { data: existing } = await supabase.storage.getBucket(bucket.name);
  if (existing) {
    console.log(`${bucket.name} : déjà existant.`);
  } else {
    const { error } = await supabase.storage.createBucket(bucket.name, {
      public: bucket.public,
    });
    if (error) {
      console.error(`${bucket.name} : échec (${error.message}).`);
    } else {
      console.log(`${bucket.name} : créé (public).`);
    }
  }
}
