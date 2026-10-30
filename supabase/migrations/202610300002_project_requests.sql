begin;

-- Demandes envoyees depuis le formulaire "Project Request" du site web public.
-- Les insertions passent uniquement par l'API /api/project-requests (cle service role).
create table if not exists public.project_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  email text not null,
  phone text,
  project_type text not null,
  timeline text,
  budget text,
  message text not null,
  status text not null default 'New' check (status in ('New', 'Contacted', 'Converted', 'Lost')),
  source text,
  handled_by uuid references public.profiles(id) on delete set null,
  handled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (nullif(btrim(name), '') is not null),
  check (nullif(btrim(email), '') is not null),
  check (nullif(btrim(project_type), '') is not null),
  check (nullif(btrim(message), '') is not null)
);

drop trigger if exists project_requests_set_updated_at on public.project_requests;
create trigger project_requests_set_updated_at before update on public.project_requests
for each row execute function public.set_updated_at();

drop trigger if exists audit_project_requests on public.project_requests;
create trigger audit_project_requests after update or delete on public.project_requests
for each row execute function public.audit_change();

create index if not exists project_requests_created_at_idx on public.project_requests(created_at desc);
create index if not exists project_requests_status_idx on public.project_requests(status);

alter table public.project_requests enable row level security;

drop policy if exists project_requests_staff_select on public.project_requests;
create policy project_requests_staff_select on public.project_requests for select to authenticated
using (public.current_profile_id() is not null);

drop policy if exists project_requests_staff_update on public.project_requests;
create policy project_requests_staff_update on public.project_requests for update to authenticated
using (public.current_profile_id() is not null)
with check (public.current_profile_id() is not null);

drop policy if exists project_requests_admin_delete on public.project_requests;
create policy project_requests_admin_delete on public.project_requests for delete to authenticated
using (public.is_admin());

grant select, update, delete on public.project_requests to authenticated;

commit;
