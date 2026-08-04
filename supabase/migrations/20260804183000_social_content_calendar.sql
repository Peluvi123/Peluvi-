create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (platform in ('instagram', 'facebook', 'both')),
  media_type text not null default 'image' check (media_type in ('image', 'carousel', 'reel', 'text')),
  caption text not null default '',
  media_urls jsonb not null default '[]'::jsonb,
  scheduled_at timestamptz,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'processing', 'published', 'failed')),
  result jsonb,
  error text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists social_posts_due_idx
  on public.social_posts (status, scheduled_at)
  where status = 'scheduled';

alter table public.social_posts enable row level security;

comment on table public.social_posts is
  'Parrilla privada de Peluvi Social. Solo el backend con service role puede acceder.';
