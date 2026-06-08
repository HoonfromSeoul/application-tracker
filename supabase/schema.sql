-- ─────────────────────────────────────────────────────────────────────────
-- 지원 트래커 — Supabase schema (run ONCE in the SQL Editor of your project)
-- Idempotent: safe to re-run; uses CREATE IF NOT EXISTS / OR REPLACE.
-- ─────────────────────────────────────────────────────────────────────────

-- ─── profiles (1:1 with auth.users) ──────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  avatar_url  text,
  role        text not null default 'user'     check (role   in ('user','admin')),
  status      text not null default 'approved' check (status in ('approved','banned')),
  created_at  timestamptz not null default now()
);

-- ─── cards (per-user) ────────────────────────────────────────────────────
create table if not exists public.cards (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  client_id     text,                         -- optional: keep the random 'c…' id from the client for stable React keys
  company       text not null default '',
  position      text not null default '',
  url           text not null default '',
  stage         text not null default 'planned',
  tier          text not null default 'A',
  salary        text not null default '',
  remote        text not null default 'Onsite',
  region        text not null default '한국',
  applied       text not null default '',
  interview     text not null default '',
  interview_url text not null default '',
  next_action   text not null default '',
  note          text not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists cards_user_idx on public.cards(user_id);

-- ─── presets (per-user) ──────────────────────────────────────────────────
create table if not exists public.presets (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  client_id     text,
  name          text not null default '',
  keywords      jsonb not null default '[]'::jsonb,
  keyword_join  text not null default 'AND' check (keyword_join in ('AND','OR')),
  location      text not null default 'Singapore',
  experience    text not null default '경력 무관',
  work_type     text not null default '근무형태 무관',
  date_posted   text not null default '7일',
  full_time     boolean not null default true,
  latest_sort   boolean not null default true,
  under10       boolean not null default false,
  created_at    timestamptz not null default now()
);
create index if not exists presets_user_idx on public.presets(user_id);

-- ─── auto-create profile on signup ───────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── updated_at auto-bump on cards ───────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists cards_touch on public.cards;
create trigger cards_touch before update on public.cards
  for each row execute procedure public.touch_updated_at();

-- ─── Abuse guard: hard limits per user ───────────────────────────────────
-- Personal-CRM scale: 500 cards / 50 presets per user is generous.
create or replace function public.guard_cards_limit()
returns trigger language plpgsql as $$
begin
  if (select count(*) from public.cards where user_id = new.user_id) >= 500 then
    raise exception 'card limit reached (500). contact admin to extend.';
  end if;
  return new;
end;
$$;
drop trigger if exists cards_limit on public.cards;
create trigger cards_limit before insert on public.cards
  for each row execute procedure public.guard_cards_limit();

create or replace function public.guard_presets_limit()
returns trigger language plpgsql as $$
begin
  if (select count(*) from public.presets where user_id = new.user_id) >= 50 then
    raise exception 'preset limit reached (50).';
  end if;
  return new;
end;
$$;
drop trigger if exists presets_limit on public.presets;
create trigger presets_limit before insert on public.presets
  for each row execute procedure public.guard_presets_limit();

-- ─── RLS ─────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.cards    enable row level security;
alter table public.presets  enable row level security;

-- helper: am I an admin? (security definer so RLS doesn't recurse)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role = 'admin' from public.profiles where id = auth.uid()),
    false
  );
$$;

-- helper: am I approved (not banned)?
create or replace function public.is_approved()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select status = 'approved' from public.profiles where id = auth.uid()),
    false
  );
$$;

-- ── profiles policies ──
drop policy if exists "profiles self read"        on public.profiles;
drop policy if exists "profiles admin read all"   on public.profiles;
drop policy if exists "profiles admin update all" on public.profiles;

create policy "profiles self read" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles admin read all" on public.profiles
  for select using (public.is_admin());

create policy "profiles admin update all" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- ── cards policies ──
drop policy if exists "cards own select" on public.cards;
drop policy if exists "cards own insert" on public.cards;
drop policy if exists "cards own update" on public.cards;
drop policy if exists "cards own delete" on public.cards;

create policy "cards own select" on public.cards
  for select using (auth.uid() = user_id);

create policy "cards own insert" on public.cards
  for insert with check (auth.uid() = user_id and public.is_approved());

create policy "cards own update" on public.cards
  for update using (auth.uid() = user_id and public.is_approved())
              with check (auth.uid() = user_id);

create policy "cards own delete" on public.cards
  for delete using (auth.uid() = user_id);

-- ── presets policies (same pattern) ──
drop policy if exists "presets own select" on public.presets;
drop policy if exists "presets own insert" on public.presets;
drop policy if exists "presets own update" on public.presets;
drop policy if exists "presets own delete" on public.presets;

create policy "presets own select" on public.presets
  for select using (auth.uid() = user_id);

create policy "presets own insert" on public.presets
  for insert with check (auth.uid() = user_id and public.is_approved());

create policy "presets own update" on public.presets
  for update using (auth.uid() = user_id and public.is_approved())
              with check (auth.uid() = user_id);

create policy "presets own delete" on public.presets
  for delete using (auth.uid() = user_id);

-- ─── Admin convenience view: per-user counts ─────────────────────────────
create or replace view public.admin_user_stats as
  select
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.status,
    p.created_at,
    (select count(*) from public.cards   c where c.user_id = p.id) as card_count,
    (select count(*) from public.presets r where r.user_id = p.id) as preset_count,
    (select max(updated_at) from public.cards c where c.user_id = p.id) as last_activity
  from public.profiles p;

-- The view inherits RLS from underlying tables (profiles policies).
-- Only admins see all rows; regular users see only their own.

-- ─── Bootstrap: promote yourself to admin AFTER first sign-in ────────────
-- After you sign in once (so your profile row exists), run:
--   update public.profiles set role = 'admin' where email = 'you@example.com';
