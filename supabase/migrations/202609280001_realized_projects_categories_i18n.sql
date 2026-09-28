alter table public.realized_projects
add column if not exists name_fr text,
add column if not exists name_en text,
add column if not exists name_it text,
add column if not exists categories text[] not null default '{}'::text[],
add column if not exists description_fr text,
add column if not exists description_en text,
add column if not exists description_it text;

update public.realized_projects
set
  name_fr = coalesce(nullif(name_fr, ''), name),
  name_en = coalesce(nullif(name_en, ''), name),
  name_it = coalesce(nullif(name_it, ''), name),
  description_fr = coalesce(nullif(description_fr, ''), description),
  description_en = coalesce(nullif(description_en, ''), description),
  description_it = coalesce(nullif(description_it, ''), description);

alter table public.realized_projects
alter column name_fr set not null,
alter column name_en set not null,
alter column name_it set not null,
alter column description_fr set not null,
alter column description_en set not null,
alter column description_it set not null;

alter table public.realized_projects
drop constraint if exists realized_projects_categories_max;

alter table public.realized_projects
add constraint realized_projects_categories_max
check (array_length(categories, 1) is null or array_length(categories, 1) <= 20);
