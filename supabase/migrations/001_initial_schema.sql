-- ==============================================================================
-- BARISTA STUDIO — ROBUST INITIAL DATABASE SCHEMA & POLICIES
-- Run this in Supabase SQL Editor
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text,
    avatar_url text,
    role text default 'barista' check (role in ('barista', 'head_barista', 'shop_owner', 'trainer')),
    theme_preference text default 'system' check (theme_preference in ('light', 'dark', 'system')),
    default_unit_system text default 'metric' check (default_unit_system in ('metric', 'imperial', 'custom')),
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Trigger to auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do update set
    full_name = coalesce(excluded.full_name, profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. MEASUREMENT UNITS TABLE
create table if not exists public.measurement_units (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    name text not null,
    symbol text not null,
    unit_type text default 'volume' check (unit_type in ('volume', 'weight', 'count', 'custom')),
    is_convertible boolean default false,
    conversion_factor_to_base numeric(12,4),
    sort_order integer default 0,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.measurement_units enable row level security;
drop policy if exists "Users view system and own units" on public.measurement_units;
create policy "Users view system and own units" on public.measurement_units for select using (user_id is null or auth.uid() = user_id);
drop policy if exists "Users insert own units" on public.measurement_units;
create policy "Users insert own units" on public.measurement_units for insert with check (auth.uid() = user_id);
drop policy if exists "Users update own units" on public.measurement_units;
create policy "Users update own units" on public.measurement_units for update using (auth.uid() = user_id);
drop policy if exists "Users delete own units" on public.measurement_units;
create policy "Users delete own units" on public.measurement_units for delete using (auth.uid() = user_id);

-- Seed standard system measurement units if not exists
insert into public.measurement_units (user_id, name, symbol, unit_type, is_convertible, conversion_factor_to_base, sort_order)
select null, 'Milliliter', 'ml', 'volume', true, 1.0, 1
where not exists (select 1 from public.measurement_units where symbol = 'ml' and user_id is null);

insert into public.measurement_units (user_id, name, symbol, unit_type, is_convertible, conversion_factor_to_base, sort_order)
select null, 'Ounce', 'oz', 'volume', true, 29.5735, 2
where not exists (select 1 from public.measurement_units where symbol = 'oz' and user_id is null);

insert into public.measurement_units (user_id, name, symbol, unit_type, is_convertible, conversion_factor_to_base, sort_order)
select null, 'Gram', 'g', 'weight', true, 1.0, 3
where not exists (select 1 from public.measurement_units where symbol = 'g' and user_id is null);

insert into public.measurement_units (user_id, name, symbol, unit_type, is_convertible, conversion_factor_to_base, sort_order)
select null, 'Kilogram', 'kg', 'weight', true, 1000.0, 4
where not exists (select 1 from public.measurement_units where symbol = 'kg' and user_id is null);

insert into public.measurement_units (user_id, name, symbol, unit_type, is_convertible, conversion_factor_to_base, sort_order)
select null, 'Liter', 'L', 'volume', true, 1000.0, 5
where not exists (select 1 from public.measurement_units where symbol = 'L' and user_id is null);

insert into public.measurement_units (user_id, name, symbol, unit_type, is_convertible, conversion_factor_to_base, sort_order)
select null, 'Pump', 'pump', 'custom', false, null, 6
where not exists (select 1 from public.measurement_units where symbol = 'pump' and user_id is null);

insert into public.measurement_units (user_id, name, symbol, unit_type, is_convertible, conversion_factor_to_base, sort_order)
select null, 'Scoop', 'scoop', 'custom', false, null, 7
where not exists (select 1 from public.measurement_units where symbol = 'scoop' and user_id is null);

insert into public.measurement_units (user_id, name, symbol, unit_type, is_convertible, conversion_factor_to_base, sort_order)
select null, 'Teaspoon', 'tsp', 'volume', true, 4.9289, 8
where not exists (select 1 from public.measurement_units where symbol = 'tsp' and user_id is null);

insert into public.measurement_units (user_id, name, symbol, unit_type, is_convertible, conversion_factor_to_base, sort_order)
select null, 'Tablespoon', 'tbsp', 'volume', true, 14.7868, 9
where not exists (select 1 from public.measurement_units where symbol = 'tbsp' and user_id is null);

insert into public.measurement_units (user_id, name, symbol, unit_type, is_convertible, conversion_factor_to_base, sort_order)
select null, 'Shot', 'shot', 'volume', false, null, 10
where not exists (select 1 from public.measurement_units where symbol = 'shot' and user_id is null);

-- 3. CATEGORIES TABLE
create table if not exists public.categories (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    category_type text not null check (category_type in ('recipe', 'ingredient', 'guide')),
    name text not null,
    slug text not null,
    description text,
    icon text,
    sort_order integer default 0,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    unique(user_id, category_type, name)
);

alter table public.categories enable row level security;
drop policy if exists "Users manage own categories" on public.categories;
create policy "Users manage own categories" on public.categories for all using (auth.uid() = user_id);

-- 4. INGREDIENTS TABLE
create table if not exists public.ingredients (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    name text not null,
    brand text,
    category_id uuid references public.categories(id) on delete set null,
    default_unit_id uuid references public.measurement_units(id) on delete set null,
    description text,
    image_url text,
    notes text,
    is_active boolean default true not null,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.ingredients enable row level security;
drop policy if exists "Users manage own ingredients" on public.ingredients;
create policy "Users manage own ingredients" on public.ingredients for all using (auth.uid() = user_id);

-- 5. RECIPES TABLE
create table if not exists public.recipes (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    name_th text not null,
    name_en text,
    description text,
    cover_image_url text,
    category_id uuid references public.categories(id) on delete set null,
    drink_type text check (drink_type in ('hot', 'iced', 'blended', 'specialty', 'cold_brew', 'filter')),
    glass_size text,
    glass_type text,
    lid_type text,
    straw_type text,
    serving_notes text,
    status text not null default 'draft' check (status in ('draft', 'incomplete', 'testing', 'verified', 'archived')),
    difficulty text default 'medium' check (difficulty in ('easy', 'medium', 'advanced')),
    prep_time_seconds integer default 0,
    is_archived boolean default false not null,
    current_version integer default 1 not null,
    tags text[] default array[]::text[],
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.recipes enable row level security;
drop policy if exists "Users manage own recipes" on public.recipes;
create policy "Users manage own recipes" on public.recipes for all using (auth.uid() = user_id);

-- 6. RECIPE INGREDIENTS TABLE
create table if not exists public.recipe_ingredients (
    id uuid primary key default gen_random_uuid(),
    recipe_id uuid references public.recipes(id) on delete cascade not null,
    ingredient_id uuid references public.ingredients(id) on delete restrict not null,
    quantity numeric(10,2) not null,
    unit_id uuid references public.measurement_units(id) on delete set null,
    custom_unit_symbol text,
    sort_order integer default 0 not null,
    note text,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.recipe_ingredients enable row level security;
drop policy if exists "Users manage own recipe ingredients" on public.recipe_ingredients;
create policy "Users manage own recipe ingredients" on public.recipe_ingredients for all 
using (exists (select 1 from public.recipes r where r.id = recipe_id and r.user_id = auth.uid()));

-- 7. RECIPE STEPS TABLE
create table if not exists public.recipe_steps (
    id uuid primary key default gen_random_uuid(),
    recipe_id uuid references public.recipes(id) on delete cascade not null,
    step_number integer not null,
    title text not null,
    description text,
    duration_seconds integer default 0,
    equipment text,
    image_url text,
    additional_note text,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.recipe_steps enable row level security;
drop policy if exists "Users manage own recipe steps" on public.recipe_steps;
create policy "Users manage own recipe steps" on public.recipe_steps for all 
using (exists (select 1 from public.recipes r where r.id = recipe_id and r.user_id = auth.uid()));

-- 8. RECIPE NOTES & TECHNIQUES TABLE
create table if not exists public.recipe_notes (
    id uuid primary key default gen_random_uuid(),
    recipe_id uuid references public.recipes(id) on delete cascade not null,
    note_type text not null check (note_type in ('tip', 'important', 'common_mistake', 'troubleshooting', 'taste_adjustment', 'customer_request', 'avoid')),
    title text,
    content text not null,
    sort_order integer default 0 not null,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.recipe_notes enable row level security;
drop policy if exists "Users manage own recipe notes" on public.recipe_notes;
create policy "Users manage own recipe notes" on public.recipe_notes for all 
using (exists (select 1 from public.recipes r where r.id = recipe_id and r.user_id = auth.uid()));

-- 9. RECIPE VARIANTS TABLE
create table if not exists public.recipe_variants (
    id uuid primary key default gen_random_uuid(),
    parent_recipe_id uuid references public.recipes(id) on delete cascade not null,
    variant_name text not null,
    description text,
    diff_payload jsonb not null default '{}'::jsonb,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.recipe_variants enable row level security;
drop policy if exists "Users manage own recipe variants" on public.recipe_variants;
create policy "Users manage own recipe variants" on public.recipe_variants for all 
using (exists (select 1 from public.recipes r where r.id = parent_recipe_id and r.user_id = auth.uid()));

-- 10. RECIPE VERSIONS TABLE
create table if not exists public.recipe_versions (
    id uuid primary key default gen_random_uuid(),
    recipe_id uuid references public.recipes(id) on delete cascade not null,
    version_number integer not null,
    created_by uuid references auth.users(id) on delete set null,
    change_summary text not null,
    change_reason text,
    snapshot jsonb not null,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.recipe_versions enable row level security;
drop policy if exists "Users manage own recipe versions" on public.recipe_versions;
create policy "Users manage own recipe versions" on public.recipe_versions for all 
using (exists (select 1 from public.recipes r where r.id = recipe_id and r.user_id = auth.uid()));

-- 11. TRAINING GUIDES TABLE
create table if not exists public.training_guides (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    category_id uuid references public.categories(id) on delete set null,
    cover_image_url text,
    description text,
    content text not null,
    tags text[] default array[]::text[],
    is_published boolean default true not null,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.training_guides enable row level security;
drop policy if exists "Users manage own guides" on public.training_guides;
create policy "Users manage own guides" on public.training_guides for all using (auth.uid() = user_id);

-- 12. PRACTICE SESSIONS & ANSWERS
create table if not exists public.practice_sessions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    quiz_mode text not null check (quiz_mode in ('ingredient_quiz', 'step_ordering', 'recipe_recall', 'equipment_quiz', 'timed_challenge', 'mixed')),
    total_questions integer not null,
    correct_count integer not null default 0,
    time_spent_seconds integer not null default 0,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.practice_sessions enable row level security;
drop policy if exists "Users manage own practice sessions" on public.practice_sessions;
create policy "Users manage own practice sessions" on public.practice_sessions for all using (auth.uid() = user_id);

create table if not exists public.practice_answers (
    id uuid primary key default gen_random_uuid(),
    session_id uuid references public.practice_sessions(id) on delete cascade not null,
    recipe_id uuid references public.recipes(id) on delete set null,
    question_type text not null,
    is_correct boolean not null,
    user_response jsonb not null,
    correct_response jsonb not null,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.practice_answers enable row level security;
drop policy if exists "Users manage own practice answers" on public.practice_answers;
create policy "Users manage own practice answers" on public.practice_answers for all 
using (exists (select 1 from public.practice_sessions s where s.id = session_id and s.user_id = auth.uid()));

-- 13. STORAGE BUCKETS CONFIGURATION
insert into storage.buckets (id, name, public) 
values 
  ('recipe-media', 'recipe-media', true),
  ('ingredient-media', 'ingredient-media', true),
  ('guide-media', 'guide-media', true)
on conflict (id) do update set public = true;

drop policy if exists "Allow authenticated uploads to recipe-media" on storage.objects;
create policy "Allow authenticated uploads to recipe-media" 
on storage.objects for insert to authenticated 
with check (bucket_id in ('recipe-media', 'ingredient-media', 'guide-media'));

drop policy if exists "Allow public view for media" on storage.objects;
create policy "Allow public view for media" 
on storage.objects for select 
using (bucket_id in ('recipe-media', 'ingredient-media', 'guide-media'));
