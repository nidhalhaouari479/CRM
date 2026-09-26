create table public.realized_projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  stacks text[] not null default '{}'::text[],
  description text not null,
  project_year integer not null check (project_year between 1990 and 2100),
  client_name text not null,
  project_url text,
  github_url text,
  image_urls text[] not null default '{}'::text[],
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (array_length(stacks, 1) is not null),
  check (array_length(image_urls, 1) is null or array_length(image_urls, 1) <= 30)
);

create trigger realized_projects_set_updated_at before update on public.realized_projects
for each row execute function public.set_updated_at();

create index realized_projects_created_at_idx on public.realized_projects(created_at desc);
create index realized_projects_project_year_idx on public.realized_projects(project_year desc);

alter table public.realized_projects enable row level security;

create policy realized_projects_admin_all on public.realized_projects
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create trigger audit_realized_projects after insert or update or delete on public.realized_projects
for each row execute function public.audit_change();

grant select, insert, update, delete on public.realized_projects to authenticated;
