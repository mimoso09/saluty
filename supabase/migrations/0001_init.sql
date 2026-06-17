-- ============================================================
-- Saluty — Initial schema
-- Run in the SQL editor of your Supabase project, OR via:
--   supabase db push
-- ============================================================

-- Per-user analysis history. Auth is handled by Supabase Auth (auth.users),
-- so no profile table is needed for the MVP.

create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_name text not null,
  input_type text not null check (
    input_type in ('image', 'text', 'ingredients', 'nutrition_table', 'barcode')
  ),
  image_url text,
  raw_input text,
  saluty_score smallint check (saluty_score between 1 and 10),
  processing_level text check (
    processing_level in (
      'natural',
      'mínimamente procesado',
      'procesado',
      'ultraprocesado'
    )
  ),
  analysis_json jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists analyses_user_id_created_at_idx
  on public.analyses (user_id, created_at desc);

-- Row Level Security: a user can only see / modify their own analyses.
alter table public.analyses enable row level security;

drop policy if exists "analyses_select_own" on public.analyses;
create policy "analyses_select_own"
  on public.analyses
  for select
  using (auth.uid() = user_id);

drop policy if exists "analyses_insert_own" on public.analyses;
create policy "analyses_insert_own"
  on public.analyses
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "analyses_delete_own" on public.analyses;
create policy "analyses_delete_own"
  on public.analyses
  for delete
  using (auth.uid() = user_id);

-- ============================================================
-- Cached Open Food Facts + Claude responses keyed by content hash.
-- Lets us short-circuit repeat analyses (same barcode → same response).
-- ============================================================
create table if not exists public.analysis_cache (
  cache_key text primary key,
  analysis_json jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists analysis_cache_created_at_idx
  on public.analysis_cache (created_at desc);

-- Cache is server-side only (service role), so no RLS policies needed.
alter table public.analysis_cache enable row level security;
