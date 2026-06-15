// ============================================================
// Saluty — Demo auth (localStorage only, no backend)
// ============================================================
'use client';
import { useEffect, useState } from 'react';

export type SalutyUser = {
  email: string;
  name: string;
};

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

function emitChange() {
  window.dispatchEvent(new Event('saluty:auth-change'));
}

export function getCurrentUser(): SalutyUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { email } = JSON.parse(raw) as { email: string };
    const user = loadUsers().find((u) => u.email === email);
    if (!user) return null;
    return { email: user.email, name: user.name };
  } catch {
    return null;
  }
}

export class AuthError extends Error {}

export function signUp(input: { name: string; email: string; password: string }): SalutyUser {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  if (!name) throw new AuthError('Escribe tu nombre.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AuthError('Correo no válido.');
  if (password.length < 6) throw new AuthError('La contraseña debe tener al menos 6 caracteres.');

  const users = loadUsers();
  if (users.some((u) => u.email === email)) throw new AuthError('Ya existe una cuenta con ese correo.');
  users.push({ email, name, password });
  saveUsers(users);
  localStorage.setItem(SESSION_KEY, JSON.stringify({ email }));
  emitChange();
  return { email, name };
}

export function signIn(input: { email: string; password: string }): SalutyUser {
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  if (!email || !password) throw new AuthError('Completa correo y contraseña.');
  const user = loadUsers().find((u) => u.email === email);
  if (!user || user.password !== password) throw new AuthError('Correo o contraseña incorrectos.');
  localStorage.setItem(SESSION_KEY, JSON.stringify({ email }));
  emitChange();
  return { email: user.email, name: user.name };
}

export function signOut() {
  localStorage.removeItem(SESSION_KEY);
  emitChange();
}

/**
 * React hook: returns { user, loading }. user is null until the first
 * client effect runs (loading=true on first render to avoid hydration
 * mismatches and flickering).
 */
export function useUser(): { user: SalutyUser | null; loading: boolean } {
  const [user, setUser] = useState<SalutyUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getCurrentUser());
    setLoading(false);
    const onChange = () => setUser(getCurrentUser());
    window.addEventListener('saluty:auth-change', onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener('saluty:auth-change', onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  return { user, loading };
}
