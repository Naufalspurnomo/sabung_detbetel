create type debate_status as enum ('setup', 'active', 'judged', 'closed');
create type generated_content_type as enum ('respect_thread', 'oc_profile', 'tier_list');

create table public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  name text,
  avatar text,
  provider text,
  created_at timestamptz not null default now()
);

create table public.characters (
  id uuid primary key default gen_random_uuid(),
  page_title text not null unique,
  name text not null,
  short_name text,
  series text,
  tier text,
  attack_potency text,
  speed text,
  durability text,
  intelligence text,
  abilities jsonb not null default '[]',
  weaknesses jsonb not null default '[]',
  keys jsonb not null default '[]',
  image_url text,
  wiki_url text not null,
  raw_stats jsonb not null default '{}',
  cached_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table public.debates (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references public.users(id) on delete set null,
  opponent_id uuid references public.users(id) on delete set null,
  char1_title text not null,
  char2_title text not null,
  status debate_status not null default 'setup',
  winner_title text,
  verdict jsonb,
  confidence text,
  created_at timestamptz not null default now(),
  judged_at timestamptz
);

create table public.arguments (
  id uuid primary key default gen_random_uuid(),
  debate_id uuid not null references public.debates(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  character_title text not null,
  content text not null,
  ai_analysis jsonb,
  created_at timestamptz not null default now()
);

create table public.leaderboard (
  user_id uuid primary key references public.users(id) on delete cascade,
  wins integer not null default 0,
  losses integer not null default 0,
  win_rate numeric(5, 2) not null default 0,
  total_debates integer not null default 0,
  rank integer,
  updated_at timestamptz not null default now()
);

create table public.generated_content (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  type generated_content_type not null,
  character_title text,
  content text not null,
  format text,
  created_at timestamptz not null default now()
);

create index characters_page_title_idx on public.characters using btree (page_title);
create index characters_tier_idx on public.characters using btree (tier);
create index debates_status_created_idx on public.debates using btree (status, created_at desc);
create index arguments_debate_created_idx on public.arguments using btree (debate_id, created_at);

alter table public.users enable row level security;
alter table public.characters enable row level security;
alter table public.debates enable row level security;
alter table public.arguments enable row level security;
alter table public.leaderboard enable row level security;
alter table public.generated_content enable row level security;

create policy "public can read cached characters"
  on public.characters for select
  using (true);

create policy "public can read judged debates"
  on public.debates for select
  using (status in ('active', 'judged'));

create policy "public can read debate arguments"
  on public.arguments for select
  using (true);

create policy "public can read leaderboard"
  on public.leaderboard for select
  using (true);
