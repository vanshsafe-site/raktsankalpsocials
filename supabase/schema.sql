-- Raktsankalp Social Media Tracker
-- The live database schema is applied by Lovable Cloud. Keep this file for self-hosted setup.

create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  platform text not null check (platform in ('youtube', 'instagram', 'facebook', 'twitter', 'linkedin')),
  posted boolean not null default false,
  post_url text,
  screenshot_url text,
  screenshot_path text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (date, platform)
);

grant select on public.social_posts to anon;
grant select on public.social_posts to authenticated;
grant all on public.social_posts to service_role;

alter table public.social_posts enable row level security;
create policy "Anyone can view social posting activity" on public.social_posts for select to anon, authenticated using (true);
create index if not exists social_posts_date_idx on public.social_posts (date);
create index if not exists social_posts_date_platform_idx on public.social_posts (date, platform);

create or replace function public.update_social_posts_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists social_posts_updated_at on public.social_posts;
create trigger social_posts_updated_at before update on public.social_posts for each row execute function public.update_social_posts_updated_at();

-- Create a private storage bucket named social-proof with a 5 MB file limit.
-- The app's server route proxies approved proof images for public viewing.
