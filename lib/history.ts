// ============================================================
// Saluty — Analysis history (dual-mode)
//   • Supabase if configured (cloud, multi-device, RLS)
//   • localStorage otherwise (offline, per-device)
// ============================================================
'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import type { AnalysisResult } from '@/types/analysis';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { useUser } from '@/lib/auth';

const HISTORY_KEY = 'saluty_history';
const LATEST_KEY = 'saluty_result';
const MAX_ITEMS = 50;
const CHANGE_EVENT = 'saluty:history-change';

export type StoredAnalysis = AnalysisResult & {
  id: string;
  analyzedAt: string;
};

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

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
// localStorage path
// ───────────────────────────────────────────────────────────
export function loadLocalHistory(): StoredAnalysis[] {
  if (typeof window === 'undefined') return [];
  const stored = safeParse<StoredAnalysis[]>(localStorage.getItem(HISTORY_KEY));
  return Array.isArray(stored) ? stored : [];
}

function saveLocal(result: AnalysisResult): StoredAnalysis {
  const entry: StoredAnalysis = {
    ...result,
    id: result.id || genId(),
    analyzedAt: result.analyzedAt || new Date().toISOString(),
  };
  const items = [entry, ...loadLocalHistory().filter((h) => h.id !== entry.id)].slice(0, MAX_ITEMS);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
  localStorage.setItem(LATEST_KEY, JSON.stringify(entry));
  sessionStorage.setItem(LATEST_KEY, JSON.stringify(entry));
  emit();
  return entry;
}

function deleteLocal(id: string): void {
  const remaining = loadLocalHistory().filter((h) => h.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(remaining));
  const latest = safeParse<StoredAnalysis>(localStorage.getItem(LATEST_KEY));
  if (latest && latest.id === id) {
    localStorage.removeItem(LATEST_KEY);
    sessionStorage.removeItem(LATEST_KEY);
  }
  emit();
}

// Always keep "latest" cached locally so /result/latest works in both modes.
export function saveAnalysis(result: AnalysisResult): StoredAnalysis {
  return saveLocal(result);
}

export function getLatest(): StoredAnalysis | null {
  if (typeof window === 'undefined') return null;
  return (
    safeParse<StoredAnalysis>(sessionStorage.getItem(LATEST_KEY)) ??
    safeParse<StoredAnalysis>(localStorage.getItem(LATEST_KEY))
  );
}

export function getById(id: string): StoredAnalysis | null {
  if (id === 'latest') return getLatest();
  return loadLocalHistory().find((h) => h.id === id) ?? null;
}

export function deleteAnalysis(id: string): void {
  deleteLocal(id);
  // Best-effort Supabase delete (the row may or may not exist there)
  if (isSupabaseConfigured()) {
    const supabase = getSupabase()!;
    void supabase.from('analyses').delete().eq('id', id);
  }
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
  localStorage.removeItem(LATEST_KEY);
  sessionStorage.removeItem(LATEST_KEY);
  emit();
}

// ───────────────────────────────────────────────────────────
// useSyncExternalStore snapshots
// ───────────────────────────────────────────────────────────
let cachedSnapshot: StoredAnalysis[] | null = null;
let cachedKey = '';

function getSnapshot(): StoredAnalysis[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(HISTORY_KEY) ?? '';
  if (raw === cachedKey && cachedSnapshot) return cachedSnapshot;
  cachedKey = raw;
  cachedSnapshot = loadLocalHistory();
  return cachedSnapshot;
}

const SERVER_SNAPSHOT: StoredAnalysis[] = [];
const getServerSnapshot = () => SERVER_SNAPSHOT;

// ───────────────────────────────────────────────────────────
// Hooks
// ───────────────────────────────────────────────────────────

/**
 * Returns analysis history.
 * - When Supabase is configured + user signed in → cloud history (multi-device).
 * - Otherwise → localStorage.
 */
export function useHistory(): StoredAnalysis[] {
  const localHistory = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const cloud = useCloudHistory();
  return cloud ?? localHistory;
}

export function useAnalysisById(id: string | undefined): StoredAnalysis | null {
  const history = useHistory();
  if (!id) return null;
  if (id === 'latest') return history[0] ?? getLatest();
  return history.find((h) => h.id === id) ?? getById(id);
}

function useCloudHistory(): StoredAnalysis[] | null {
  const { user } = useUser();
  const enabled = isSupabaseConfigured() && !!user;
  const [items, setItems] = useState<StoredAnalysis[] | null>(null);

  useEffect(() => {
    if (!enabled || !user) return;
    const supabase = getSupabase()!;
    let cancelled = false;

    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from('analyses')
        .select('id, analysis_json, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(MAX_ITEMS);

      if (cancelled) return;
      if (error || !data) {
        setItems([]);
        return;
      }
      const mapped: StoredAnalysis[] = data.map((row) => ({
        ...(row.analysis_json as AnalysisResult),
        id: row.id,
        analyzedAt: row.created_at,
      }));
      setItems(mapped);
    };

    fetchHistory();

    const handler = () => fetchHistory();
    window.addEventListener(CHANGE_EVENT, handler);
    return () => {
      cancelled = true;
      window.removeEventListener(CHANGE_EVENT, handler);
    };
  }, [enabled, user]);

  return enabled ? items : null;
}
