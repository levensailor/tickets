-- Band Guru: initial schema
-- Run this script manually in the Supabase SQL editor.

-- Profiles (mirrors auth.users with IdP-captured identity fields)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text,
  last_name text,
  avatar_url text,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles (lower(email));

-- Events
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  venue text not null,
  event_date date not null,
  event_time time not null,
  description text not null,
  ticket_cost_cents integer not null check (ticket_cost_cents >= 0),
  on_sale_at timestamptz not null,
  is_presale boolean not null default false,
  presale_at timestamptz,
  presale_cost_cents integer check (presale_cost_cents is null or presale_cost_cents >= 0),
  presale_code text,
  max_tickets_per_user integer not null default 4 check (max_tickets_per_user >= 1),
  lineup jsonb not null default '[]'::jsonb,
  status text not null default 'published' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_presale_fields_check check (
    (is_presale = false)
    or (
      is_presale = true
      and presale_at is not null
      and presale_cost_cents is not null
      and presale_code is not null
      and length(trim(presale_code)) > 0
    )
  )
);

create index if not exists events_status_onsale_idx on public.events (status, on_sale_at);
create index if not exists events_creator_id_idx on public.events (creator_id);

-- Flyer images (max 3 enforced by trigger)
create table if not exists public.event_flyers (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  storage_path text not null,
  position integer not null check (position between 1 and 3),
  created_at timestamptz not null default now(),
  unique (event_id, position)
);

create or replace function public.enforce_max_flyers()
returns trigger
language plpgsql
as $$
declare
  flyer_count integer;
begin
  select count(*) into flyer_count
  from public.event_flyers
  where event_id = new.event_id;

  if flyer_count >= 3 then
    raise exception 'Maximum of 3 flyers per event';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_max_flyers on public.event_flyers;
create trigger trg_enforce_max_flyers
  before insert on public.event_flyers
  for each row execute function public.enforce_max_flyers();

-- Cohosts
create table if not exists public.event_cohosts (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  email text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  invite_token text not null unique default encode(gen_random_bytes(24), 'hex'),
  invited_at timestamptz not null default now()
);

create unique index if not exists event_cohosts_event_email_uidx
  on public.event_cohosts (event_id, lower(email));
create index if not exists event_cohosts_token_idx on public.event_cohosts (invite_token);
create index if not exists event_cohosts_email_idx on public.event_cohosts (lower(email));
-- Orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete restrict,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  quantity integer not null check (quantity >= 1),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  is_presale boolean not null default false,
  stripe_session_id text unique,
  stripe_payment_intent text,
  status text not null default 'pending' check (status in ('pending', 'paid', 'refunded')),
  created_at timestamptz not null default now()
);

create index if not exists orders_buyer_id_idx on public.orders (buyer_id);
create index if not exists orders_event_id_idx on public.orders (event_id);

-- Tickets (one row per ticket)
create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete restrict,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  ticket_code text not null unique,
  status text not null default 'valid' check (status in ('valid', 'used', 'cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists tickets_buyer_id_idx on public.tickets (buyer_id);
create index if not exists tickets_event_id_idx on public.tickets (event_id);

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_events_updated_at on public.events;
create trigger trg_events_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

-- Capture first_name, last_name, avatar_url, email from IdP metadata.
-- Handles Google, Facebook, Apple, and email provider key differences.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  first_name_val text;
  last_name_val text;
  avatar_val text;
  full_name_val text;
  name_parts text[];
begin
  first_name_val := coalesce(
    nullif(meta->>'given_name', ''),
    nullif(meta->>'first_name', ''),
    nullif(meta->>'firstName', '')
  );

  last_name_val := coalesce(
    nullif(meta->>'family_name', ''),
    nullif(meta->>'last_name', ''),
    nullif(meta->>'lastName', '')
  );

  -- Apple / some providers send full_name or name instead of given/family
  full_name_val := coalesce(
    nullif(meta->>'full_name', ''),
    nullif(meta->>'name', '')
  );

  if (first_name_val is null or last_name_val is null) and full_name_val is not null then
    name_parts := regexp_split_to_array(trim(full_name_val), '\s+');
    if first_name_val is null then
      first_name_val := name_parts[1];
    end if;
    if last_name_val is null and array_length(name_parts, 1) > 1 then
      last_name_val := array_to_string(name_parts[2:array_length(name_parts, 1)], ' ');
    end if;
  end if;

  avatar_val := coalesce(
    nullif(meta->>'avatar_url', ''),
    nullif(meta->>'picture', ''),
    nullif(meta->>'avatar', '')
  );

  insert into public.profiles (id, first_name, last_name, avatar_url, email)
  values (
    new.id,
    first_name_val,
    last_name_val,
    avatar_val,
    coalesce(new.email, '')
  )
  on conflict (id) do update set
    first_name = coalesce(excluded.first_name, public.profiles.first_name),
    last_name = coalesce(excluded.last_name, public.profiles.last_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    email = coalesce(nullif(excluded.email, ''), public.profiles.email),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Also sync profile on identity updates (e.g. linking accounts)
create or replace function public.handle_user_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  update public.profiles
  set
    email = coalesce(new.email, email),
    avatar_url = coalesce(
      nullif(meta->>'avatar_url', ''),
      nullif(meta->>'picture', ''),
      avatar_url
    ),
    updated_at = now()
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update of email, raw_user_meta_data on auth.users
  for each row execute function public.handle_user_updated();

-- Helper: is creator or accepted cohost
create or replace function public.is_event_manager(event_uuid uuid, user_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.events e
    where e.id = event_uuid and e.creator_id = user_uuid
  )
  or exists (
    select 1 from public.event_cohosts c
    where c.event_id = event_uuid
      and c.user_id = user_uuid
      and c.status = 'accepted'
  );
$$;

-- RLS
alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.event_flyers enable row level security;
alter table public.event_cohosts enable row level security;
alter table public.orders enable row level security;
alter table public.tickets enable row level security;

-- Profiles
drop policy if exists "Profiles are publicly readable" on public.profiles;
create policy "Profiles are publicly readable"
  on public.profiles for select
  using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Events
drop policy if exists "Published events are publicly readable" on public.events;
create policy "Published events are publicly readable"
  on public.events for select
  using (
    status = 'published'
    or creator_id = auth.uid()
    or public.is_event_manager(id, auth.uid())
  );

drop policy if exists "Authenticated users can create events" on public.events;
create policy "Authenticated users can create events"
  on public.events for insert
  with check (auth.uid() = creator_id);

drop policy if exists "Managers can update events" on public.events;
create policy "Managers can update events"
  on public.events for update
  using (public.is_event_manager(id, auth.uid()))
  with check (public.is_event_manager(id, auth.uid()));

drop policy if exists "Creators can delete events" on public.events;
create policy "Creators can delete events"
  on public.events for delete
  using (creator_id = auth.uid());

-- Flyers
drop policy if exists "Flyers of readable events are public" on public.event_flyers;
create policy "Flyers of readable events are public"
  on public.event_flyers for select
  using (
    exists (
      select 1 from public.events e
      where e.id = event_id
        and (
          e.status = 'published'
          or public.is_event_manager(e.id, auth.uid())
        )
    )
  );

drop policy if exists "Managers can insert flyers" on public.event_flyers;
create policy "Managers can insert flyers"
  on public.event_flyers for insert
  with check (public.is_event_manager(event_id, auth.uid()));

drop policy if exists "Managers can update flyers" on public.event_flyers;
create policy "Managers can update flyers"
  on public.event_flyers for update
  using (public.is_event_manager(event_id, auth.uid()));

drop policy if exists "Managers can delete flyers" on public.event_flyers;
create policy "Managers can delete flyers"
  on public.event_flyers for delete
  using (public.is_event_manager(event_id, auth.uid()));

-- Cohosts
drop policy if exists "Managers can read cohosts" on public.event_cohosts;
create policy "Managers can read cohosts"
  on public.event_cohosts for select
  using (
    public.is_event_manager(event_id, auth.uid())
    or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

drop policy if exists "Managers can insert cohosts" on public.event_cohosts;
create policy "Managers can insert cohosts"
  on public.event_cohosts for insert
  with check (public.is_event_manager(event_id, auth.uid()));

drop policy if exists "Managers can update cohosts" on public.event_cohosts;
create policy "Managers can update cohosts"
  on public.event_cohosts for update
  using (
    public.is_event_manager(event_id, auth.uid())
    or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

drop policy if exists "Managers can delete cohosts" on public.event_cohosts;
create policy "Managers can delete cohosts"
  on public.event_cohosts for delete
  using (public.is_event_manager(event_id, auth.uid()));

-- Orders
drop policy if exists "Buyers and managers can read orders" on public.orders;
create policy "Buyers and managers can read orders"
  on public.orders for select
  using (
    buyer_id = auth.uid()
    or public.is_event_manager(event_id, auth.uid())
  );

drop policy if exists "Buyers can create orders" on public.orders;
create policy "Buyers can create orders"
  on public.orders for insert
  with check (buyer_id = auth.uid());

drop policy if exists "Buyers can update own pending orders" on public.orders;
create policy "Buyers can update own pending orders"
  on public.orders for update
  using (buyer_id = auth.uid());

-- Tickets
drop policy if exists "Buyers and managers can read tickets" on public.tickets;
create policy "Buyers and managers can read tickets"
  on public.tickets for select
  using (
    buyer_id = auth.uid()
    or public.is_event_manager(event_id, auth.uid())
  );

drop policy if exists "Buyers can insert tickets via checkout flow" on public.tickets;
create policy "Buyers can insert tickets via checkout flow"
  on public.tickets for insert
  with check (buyer_id = auth.uid());

-- Storage bucket for flyers
insert into storage.buckets (id, name, public)
values ('flyers', 'flyers', true)
on conflict (id) do update set public = true;

drop policy if exists "Public flyer read" on storage.objects;
create policy "Public flyer read"
  on storage.objects for select
  using (bucket_id = 'flyers');

drop policy if exists "Authenticated flyer upload" on storage.objects;
create policy "Authenticated flyer upload"
  on storage.objects for insert
  with check (
    bucket_id = 'flyers'
    and auth.role() = 'authenticated'
  );

drop policy if exists "Authenticated flyer update" on storage.objects;
create policy "Authenticated flyer update"
  on storage.objects for update
  using (
    bucket_id = 'flyers'
    and auth.role() = 'authenticated'
  );

drop policy if exists "Authenticated flyer delete" on storage.objects;
create policy "Authenticated flyer delete"
  on storage.objects for delete
  using (
    bucket_id = 'flyers'
    and auth.role() = 'authenticated'
  );
