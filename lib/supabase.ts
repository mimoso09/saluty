// ============================================================
// Saluty — Supabase Client
// ============================================================
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function readUrl(): string | null {
  const u = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!u || !/^https?:\/\//i.test(u)) return null;
  return u;
}

function readAnonKey(): string | null {
  const k = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return k && k.trim().length > 0 ? k : null;
}

/**
 * Public flag (safe to call from client) — true if both URL and anon key are present.
 * Used to decide whether to use Supabase-backed auth/history or localStorage fallback.
 */
export function isSupabaseConfigured(): boolean {
  return readUrl() !== null && readAnonKey() !== null;
}

let cachedAnon: SupabaseClient | null = null;
export function getSupabase(): SupabaseClient | null {
  if (cachedAnon) return cachedAnon;
  const url = readUrl();
  const key = readAnonKey();
  if (!url || !key) return null;
  cachedAnon = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
  return cachedAnon;
}

/**
 * Back-compat: existing modules import `supabase` directly. Resolve lazily via Proxy
 * so importing this file does not crash when env vars are placeholders.
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_t, prop) {
    const real = getSupabase();
    if (!real)
      throw new Error(
        'Supabase is not configured (set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY)'
      );
    return Reflect.get(real, prop as keyof SupabaseClient);
  },
});

export function createServiceClient(): SupabaseClient {
  const url = readUrl();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Supabase service client not configured');
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
