begin;

alter table public.projects
  add column if not exists submission_key uuid;

create unique index if not exists projects_submission_key_unique
on public.projects(submission_key)
where submission_key is not null;

alter table public.payments
  add column if not exists submission_key uuid;

create unique index if not exists payments_submission_key_unique
on public.payments(submission_key)
where submission_key is not null;

create or replace function public.prevent_payment_over_collection()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  paid_total numeric(14,3);
  project_total numeric(14,3);
begin
  select coalesce(sum(amount), 0)
  into paid_total
  from public.payments
  where project_id = new.project_id
    and (tg_op <> 'UPDATE' or id <> old.id);

  paid_total := paid_total + new.amount;

  select final_price
  into project_total
  from public.projects
  where id = new.project_id;

  if project_total is not null and paid_total > project_total then
    raise exception 'Payment total cannot exceed project final price';
  end if;

  return new;
end;
$$;

drop trigger if exists payments_prevent_over_collection on public.payments;
create trigger payments_prevent_over_collection
before insert or update of project_id, amount on public.payments
for each row execute function public.prevent_payment_over_collection();

create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.profiles(id) on delete cascade,
  subject text not null,
  details text not null,
  status text not null default 'Open' check (status in ('Open', 'Reviewed', 'Closed')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (nullif(btrim(subject), '') is not null),
  check (nullif(btrim(details), '') is not null)
);

drop trigger if exists complaints_set_updated_at on public.complaints;
create trigger complaints_set_updated_at before update on public.complaints
for each row execute function public.set_updated_at();

create index if not exists complaints_employee_id_idx on public.complaints(employee_id);
create index if not exists complaints_created_at_idx on public.complaints(created_at desc);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null default 'Todo' check (status in ('Todo', 'In Progress', 'Done', 'Blocked')),
  priority text not null default 'Medium' check (priority in ('Low', 'Medium', 'High')),
  due_date date,
  client_id uuid references public.clients(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  assigned_to uuid not null references public.profiles(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (nullif(btrim(title), '') is not null)
);

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at before update on public.tasks
for each row execute function public.set_updated_at();

create index if not exists tasks_assigned_to_idx on public.tasks(assigned_to, due_date);
create index if not exists tasks_status_idx on public.tasks(status);
create index if not exists tasks_due_date_idx on public.tasks(due_date);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  kind text not null default 'info',
  entity_type text,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_recipient_idx
on public.notifications(recipient_id, read_at, created_at desc);

create table if not exists public.login_sessions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  login_at timestamptz not null default now(),
  logout_at timestamptz,
  duration_seconds integer generated always as (
    case
      when logout_at is null then null
      else greatest(0, floor(extract(epoch from logout_at - login_at))::integer)
    end
  ) stored,
  created_at timestamptz not null default now(),
  check (logout_at is null or logout_at >= login_at)
);

create index if not exists login_sessions_profile_id_idx on public.login_sessions(profile_id, login_at desc);
create unique index if not exists login_sessions_one_open_per_profile
on public.login_sessions(profile_id)
where logout_at is null;

alter table public.complaints enable row level security;
alter table public.tasks enable row level security;
alter table public.notifications enable row level security;
alter table public.login_sessions enable row level security;

drop policy if exists complaints_select on public.complaints;
create policy complaints_select on public.complaints for select to authenticated
using (employee_id = public.current_profile_id() or public.is_admin());

drop policy if exists complaints_insert on public.complaints;
create policy complaints_insert on public.complaints for insert to authenticated
with check (employee_id = public.current_profile_id());

drop policy if exists complaints_admin_update on public.complaints;
create policy complaints_admin_update on public.complaints for update to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists complaints_admin_delete on public.complaints;
create policy complaints_admin_delete on public.complaints for delete to authenticated
using (public.is_admin());

drop policy if exists tasks_select on public.tasks;
create policy tasks_select on public.tasks for select to authenticated
using (
  assigned_to = public.current_profile_id()
  or created_by = public.current_profile_id()
  or public.is_admin()
);

drop policy if exists tasks_insert on public.tasks;
create policy tasks_insert on public.tasks for insert to authenticated
with check (
  created_by = public.current_profile_id()
  and (assigned_to = public.current_profile_id() or public.is_admin())
);

drop policy if exists tasks_update on public.tasks;
create policy tasks_update on public.tasks for update to authenticated
using (assigned_to = public.current_profile_id() or public.is_admin())
with check (assigned_to = public.current_profile_id() or public.is_admin());

drop policy if exists tasks_admin_delete on public.tasks;
create policy tasks_admin_delete on public.tasks for delete to authenticated
using (public.is_admin());

drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications for select to authenticated
using (recipient_id = public.current_profile_id() or public.is_admin());

drop policy if exists notifications_update on public.notifications;
create policy notifications_update on public.notifications for update to authenticated
using (recipient_id = public.current_profile_id() or public.is_admin())
with check (recipient_id = public.current_profile_id() or public.is_admin());

drop policy if exists notifications_admin_insert on public.notifications;
create policy notifications_admin_insert on public.notifications for insert to authenticated
with check (public.is_admin());

drop policy if exists notifications_admin_delete on public.notifications;
create policy notifications_admin_delete on public.notifications for delete to authenticated
using (public.is_admin());

drop policy if exists login_sessions_select on public.login_sessions;
create policy login_sessions_select on public.login_sessions for select to authenticated
using (profile_id = public.current_profile_id() or public.is_admin());

drop policy if exists login_sessions_insert on public.login_sessions;
create policy login_sessions_insert on public.login_sessions for insert to authenticated
with check (profile_id = public.current_profile_id());

drop policy if exists login_sessions_update on public.login_sessions;
create policy login_sessions_update on public.login_sessions for update to authenticated
using (profile_id = public.current_profile_id() or public.is_admin())
with check (profile_id = public.current_profile_id() or public.is_admin());

grant select, insert, update, delete on public.complaints to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
grant select, insert, update, delete on public.notifications to authenticated;
grant select, insert, update on public.login_sessions to authenticated;

commit;
