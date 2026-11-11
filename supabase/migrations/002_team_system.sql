-- ==============================================================================
-- BARISTA STUDIO — TEAMS & SHARING SYSTEM MIGRATION (COMPLETE & ROBUST)
-- Run this in Supabase SQL Editor
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 2. TEAMS TABLE
create table if not exists public.teams (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    description text,
    invite_code text not null unique,
    owner_id uuid references auth.users(id) on delete cascade not null,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.teams enable row level security;

-- 3. TEAM MEMBERS TABLE
create table if not exists public.team_members (
    id uuid primary key default gen_random_uuid(),
    team_id uuid references public.teams(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete set null,
    email text,
    full_name text,
    avatar_url text,
    role text default 'barista' check (role in ('owner', 'admin', 'barista', 'viewer')),
    joined_at timestamptz default timezone('utc'::text, now()) not null
);

-- Ensure columns exist and user_id is nullable for invitations
alter table if exists public.team_members add column if not exists email text;
alter table if exists public.team_members add column if not exists full_name text;
alter table if exists public.team_members add column if not exists avatar_url text;
alter table if exists public.team_members alter column user_id drop not null;

alter table public.team_members enable row level security;

-- 4. TEAM SHARES TABLE (Recipes, Ingredients, Categories shared into Team)
create table if not exists public.team_shares (
    id uuid primary key default gen_random_uuid(),
    team_id uuid references public.teams(id) on delete cascade not null,
    item_type text not null check (item_type in ('recipe', 'ingredient', 'category')),
    item_id uuid not null,
    shared_by uuid references auth.users(id) on delete cascade not null,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    unique(team_id, item_type, item_id)
);

alter table public.team_shares enable row level security;

-- 5. SAFELY ADD TEAM_ID COLUMN TO EXISTING TABLES (IF THEY EXIST)
alter table if exists public.recipes add column if not exists team_id uuid references public.teams(id) on delete set null;
alter table if exists public.ingredients add column if not exists team_id uuid references public.teams(id) on delete set null;
alter table if exists public.categories add column if not exists team_id uuid references public.teams(id) on delete set null;

-- 6. SECURITY DEFINER HELPER FUNCTIONS (PREVENT INFINITE RECURSION IN RLS)
create or replace function public.is_team_admin(check_team_id uuid, check_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.teams where id = check_team_id and owner_id = check_user_id
    union
    select 1 from public.team_members where team_id = check_team_id and user_id = check_user_id and role in ('owner', 'admin')
  );
$$;

create or replace function public.is_team_member(check_team_id uuid, check_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.teams where id = check_team_id and owner_id = check_user_id
    union
    select 1 from public.team_members where team_id = check_team_id and user_id = check_user_id
  );
$$;

-- 7. RLS POLICIES FOR TEAMS
do $$
begin
    drop policy if exists "Users can view teams they belong to" on public.teams;
    drop policy if exists "Users can create teams" on public.teams;
    drop policy if exists "Owners and admins can update team" on public.teams;
    drop policy if exists "Owners can delete team" on public.teams;
exception when others then null;
end $$;

create policy "Users can view teams they belong to" on public.teams
for select using (
    owner_id = auth.uid() or public.is_team_member(id, auth.uid())
);

create policy "Users can create teams" on public.teams
for insert with check (owner_id = auth.uid());

create policy "Owners and admins can update team" on public.teams
for update using (
    public.is_team_admin(id, auth.uid())
);

create policy "Owners can delete team" on public.teams
for delete using (owner_id = auth.uid());

-- 8. RLS POLICIES FOR TEAM MEMBERS (RECURSION FREE)
do $$
begin
    drop policy if exists "Users can view members of their teams" on public.team_members;
    drop policy if exists "Team owners and admins can manage members" on public.team_members;
exception when others then null;
end $$;

create policy "Users can view members of their teams" on public.team_members
for select using (
    user_id = auth.uid() or public.is_team_member(team_id, auth.uid())
);

create policy "Team owners and admins can manage members" on public.team_members
for all using (
    public.is_team_admin(team_id, auth.uid())
);

-- 9. RLS POLICIES FOR TEAM SHARES
do $$
begin
    drop policy if exists "Team members can view shared items" on public.team_shares;
    drop policy if exists "Team members can share items" on public.team_shares;
    drop policy if exists "Team members can delete shares" on public.team_shares;
exception when others then null;
end $$;

create policy "Team members can view shared items" on public.team_shares
for select using (
    public.is_team_member(team_id, auth.uid())
);

create policy "Team members can share items" on public.team_shares
for insert with check (
    shared_by = auth.uid() and public.is_team_member(team_id, auth.uid())
);

create policy "Team members can delete shares" on public.team_shares
for delete using (
    shared_by = auth.uid() or public.is_team_admin(team_id, auth.uid())
);
