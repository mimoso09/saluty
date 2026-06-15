// ============================================================
// Saluty — Supabase Client
// ============================================================
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function readUrl(): string | null {
  const u = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!u || !/^https?:\/\//i.test(u)) return null;
  return u;
}

let cachedAnon: SupabaseClient | null = null;
export function getSupabase(): SupabaseClient | null {
  if (cachedAnon) return cachedAnon;
  const url = readUrl();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  cachedAnon = createClient(url, key);
  return cachedAnon;
}

/**
 * Back-compat: existing modules import `supabase` directly. Resolve lazily via Proxy
 * so importing this file does not crash when env vars are placeholders.
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_t, prop) {
    const real = getSupabase();
    if (!real) throw new Error('Supabase is not configured (set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY)');
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
