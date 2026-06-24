import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Single browser client, created lazily so that:
//  - the module can be imported during the build without env vars present
//    (the client is only constructed when first used in the browser), and
//  - we never instantiate more than one GoTrue auth instance.
let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment (.env.local and Vercel)."
    );
  }
  client = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return client;
}

// True only when both public env vars are present. Lets the UI show a helpful
// "not configured" message instead of throwing during render.
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
