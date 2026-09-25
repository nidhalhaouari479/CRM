-- Require a written value whenever the generic "Other" option is selected.

alter table public.clients
  add column if not exists business_sector_other text,
  add column if not exists service_type_other text;

alter table public.projects
  add column if not exists service_type_other text;

alter table public.clients
  drop constraint if exists clients_business_sector_other_required,
  drop constraint if exists clients_service_type_other_required,
  add constraint clients_business_sector_other_required check (
    business_sector is distinct from 'Autre'
    or nullif(btrim(business_sector_other), '') is not null
  ) not valid,
  add constraint clients_service_type_other_required check (
    service_type is distinct from 'Other'
    or nullif(btrim(service_type_other), '') is not null
  ) not valid;

alter table public.projects
  drop constraint if exists projects_service_type_other_required,
  add constraint projects_service_type_other_required check (
    service_type is distinct from 'Other'
    or nullif(btrim(service_type_other), '') is not null
  ) not valid;

-- NOT VALID keeps legacy rows importable, while PostgreSQL enforces the rule
-- immediately for every new or updated client/project.
