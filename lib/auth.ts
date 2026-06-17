// ============================================================
// Saluty — Auth (dual-mode)
//   • If NEXT_PUBLIC_SUPABASE_* env vars are set → real auth via Supabase.
//   • Otherwise → demo localStorage auth (works offline, single device).
// ============================================================
'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

export type SalutyUser = {
  id: string;
  email: string;
  name: string;
};

export class AuthError extends Error {}

// ── shared event channel for both modes ─────────────────────
const CHANGE_EVENT = 'saluty:auth-change';
function emit() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

// ───────────────────────────────────────────────────────────
// localStorage demo path
// ───────────────────────────────────────────────────────────
type StoredUser = SalutyUser & { password: string };
const USERS_KEY = 'saluty_users';
const SESSION_KEY = 'saluty_session';

function loadUsers(): StoredUser[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredUser[]) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function genLocalId(email: string): string {
  return `local-${btoa(email).replace(/=/g, '')}`;
}

function getLocalCurrentUser(): SalutyUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { email } = JSON.parse(raw) as { email: string };
    const user = loadUsers().find((u) => u.email === email);
    if (!user) return null;
    return { id: user.id, email: user.email, name: user.name };
  } catch {
    return null;
  }
}

function localSignUp(input: { name: string; email: string; password: string }): SalutyUser {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  if (!name) throw new AuthError('Escribe tu nombre.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AuthError('Correo no válido.');
  if (password.length < 6) throw new AuthError('La contraseña debe tener al menos 6 caracteres.');

  const users = loadUsers();
  if (users.some((u) => u.email === email)) throw new AuthError('Ya existe una cuenta con ese correo.');
  const id = genLocalId(email);
  users.push({ id, email, name, password });
  saveUsers(users);
  localStorage.setItem(SESSION_KEY, JSON.stringify({ email }));
  emit();
  return { id, email, name };
}

function localSignIn(input: { email: string; password: string }): SalutyUser {
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  if (!email || !password) throw new AuthError('Completa correo y contraseña.');
  const user = loadUsers().find((u) => u.email === email);
  if (!user || user.password !== password) throw new AuthError('Correo o contraseña incorrectos.');
  localStorage.setItem(SESSION_KEY, JSON.stringify({ email }));
  emit();
  return { id: user.id, email: user.email, name: user.name };
}

function localSignOut() {
  localStorage.removeItem(SESSION_KEY);
  emit();
}

// ───────────────────────────────────────────────────────────
// Public API (auto-routed)
// ───────────────────────────────────────────────────────────
export async function signUp(input: {
  name: string;
  email: string;
  password: string;
}): Promise<SalutyUser> {
  if (!isSupabaseConfigured()) return localSignUp(input);
  const supabase = getSupabase()!;
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (!name) throw new AuthError('Escribe tu nombre.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AuthError('Correo no válido.');
  if (input.password.length < 6) throw new AuthError('La contraseña debe tener al menos 6 caracteres.');

  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: { data: { name } },
  });
  if (error) throw new AuthError(translateSupabaseError(error.message));
  if (!data.user) throw new AuthError('No pudimos crear tu cuenta.');
  emit();
  return { id: data.user.id, email, name };
}

export async function signIn(input: {
  email: string;
  password: string;
}): Promise<SalutyUser> {
  if (!isSupabaseConfigured()) return localSignIn(input);
  const supabase = getSupabase()!;
  const email = input.email.trim().toLowerCase();
  if (!email || !input.password) throw new AuthError('Completa correo y contraseña.');
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: input.password,
  });
  if (error) throw new AuthError(translateSupabaseError(error.message));
  if (!data.user) throw new AuthError('Correo o contraseña incorrectos.');
  emit();
  const meta = (data.user.user_metadata || {}) as { name?: string };
  return {
    id: data.user.id,
    email: data.user.email || email,
    name: meta.name || email.split('@')[0],
  };
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured()) {
    await getSupabase()!.auth.signOut();
  } else {
    localSignOut();
  }
  emit();
}

function translateSupabaseError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('invalid login')) return 'Correo o contraseña incorrectos.';
  if (m.includes('already registered') || m.includes('already exists')) {
    return 'Ya existe una cuenta con ese correo.';
  }
  if (m.includes('password should be')) return 'La contraseña debe tener al menos 6 caracteres.';
  if (m.includes('invalid email')) return 'Correo no válido.';
  return msg;
}

// ───────────────────────────────────────────────────────────
// Reactive hook
// ───────────────────────────────────────────────────────────

// Local snapshot
let cachedLocalKey = '';
let cachedLocalUser: SalutyUser | null = null;
function getLocalSnapshot(): SalutyUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(SESSION_KEY) ?? '';
  if (raw === cachedLocalKey) return cachedLocalUser;
  cachedLocalKey = raw;
  cachedLocalUser = getLocalCurrentUser();
  return cachedLocalUser;
}

const getServerSnapshot = () => null;

export function useUser(): { user: SalutyUser | null; loading: boolean } {
  // For the localStorage path, useSyncExternalStore handles hydration cleanly.
  const localUser = useSyncExternalStore(subscribe, getLocalSnapshot, getServerSnapshot);

  // For the Supabase path, subscribe to auth state changes via effect.
  const supaConfigured = isSupabaseConfigured();
  const [supaUser, setSupaUser] = useState<SalutyUser | null>(null);
  const [supaLoading, setSupaLoading] = useState(supaConfigured);

  useEffect(() => {
    if (!supaConfigured) return;
    const supabase = getSupabase()!;
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      const u = data.session?.user;
      if (u) {
        const meta = (u.user_metadata || {}) as { name?: string };
        setSupaUser({
          id: u.id,
          email: u.email || '',
          name: meta.name || (u.email || '').split('@')[0],
        });
      } else {
        setSupaUser(null);
      }
      setSupaLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user;
      if (u) {
        const meta = (u.user_metadata || {}) as { name?: string };
        setSupaUser({
          id: u.id,
          email: u.email || '',
          name: meta.name || (u.email || '').split('@')[0],
        });
      } else {
        setSupaUser(null);
      }
      setSupaLoading(false);
      emit();
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [supaConfigured]);

  if (supaConfigured) return { user: supaUser, loading: supaLoading };
  return { user: localUser, loading: typeof window === 'undefined' };
}

export function isCloudAuth(): boolean {
  return isSupabaseConfigured();
}
