-- CRM Tunisie - schema, business logic and Row Level Security
-- Run this file once in Supabase > SQL Editor.

create extension if not exists pgcrypto;

create type public.app_role as enum ('admin', 'employee');
create type public.client_kind as enum ('Individual', 'Company');
create type public.sales_status as enum ('New', 'Contacted', 'In Discussion', 'Waiting', 'Confirmed', 'Lost', 'Converted');
create type public.priority_level as enum ('Low', 'Medium', 'High');
create type public.interaction_kind as enum ('Call', 'Email', 'WhatsApp', 'Message', 'Meeting', 'Video Call', 'Other');
create type public.project_status as enum ('Proposal', 'Confirmed', 'In Progress', 'On Hold', 'Completed', 'Cancelled');
create type public.payment_status as enum ('Not Paid', 'Partially Paid', 'Paid', 'Refunded');
create type public.payment_method as enum ('Cash', 'Bank Transfer', 'Card', 'Online Payment', 'Other');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$  
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  email text not null,
  phone text,
  avatar_url text,
  role public.app_role not null default 'employee',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select id from public.profiles where user_id = auth.uid() and is_active limit 1;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce(exists(
    select 1 from public.profiles
    where user_id = auth.uid() and role = 'admin' and is_active
  ), false);
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (user_id, first_name, last_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    coalesce(new.email, '')
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.protect_profile_security_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user = 'authenticated' and not public.is_admin() then
    if new.user_id is distinct from old.user_id
       or new.role is distinct from old.role
       or new.is_active is distinct from old.is_active
       or new.email is distinct from old.email then
      raise exception 'Only an administrator can change protected profile fields';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_protect_security
before update on public.profiles
for each row execute function public.protect_profile_security_fields();

create table public.app_settings (
  id boolean primary key default true check (id),
  company_name text not null default 'CRM Tunisie',
  currency text not null default 'TND',
  locale text not null default 'fr-TN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger app_settings_set_updated_at before update on public.app_settings
for each row execute function public.set_updated_at();

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete restrict,
  company_name text,
  contact_name text not null,
  phone text,
  email text,
  website text,
  facebook_url text,
  instagram_url text,
  address text,
  city text,
  country text not null default 'Tunisie',
  client_type public.client_kind not null default 'Company',
  service_type text not null,
  estimated_budget numeric(14,3) check (estimated_budget is null or estimated_budget >= 0),
  notes text,
  sales_status public.sales_status not null default 'New',
  priority public.priority_level not null default 'Medium',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (nullif(trim(company_name), '') is not null or nullif(trim(contact_name), '') is not null)
);

create trigger clients_set_updated_at before update on public.clients
for each row execute function public.set_updated_at();

create table public.interactions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  employee_id uuid not null references public.profiles(id) on delete restrict,
  type public.interaction_kind not null,
  subject text not null,
  date timestamptz not null default now(),
  duration_minutes integer check (duration_minutes is null or duration_minutes >= 0),
  summary text not null,
  client_request text,
  employee_response text,
  next_action text,
  next_contact_date timestamptz,
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete restrict,
  employee_id uuid not null references public.profiles(id) on delete restrict,
  name text not null,
  service_type text not null,
  description text,
  estimated_price numeric(14,3) check (estimated_price is null or estimated_price >= 0),
  final_price numeric(14,3) not null default 0 check (final_price >= 0),
  currency text not null default 'TND',
  status public.project_status not null default 'Proposal',
  payment_status public.payment_status not null default 'Not Paid',
  payment_amount numeric(14,3) not null default 0 check (payment_amount >= 0),
  remaining_amount numeric(14,3) generated always as (greatest(final_price - payment_amount, 0)) stored,
  payment_date date,
  start_date date,
  expected_end_date date,
  completed_at timestamptz,
  notes text,
  commission_rate_applied numeric(5,2),
  commission_amount numeric(14,3) not null default 0,
  bonus_amount numeric(14,3) not null default 0,
  commission_locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (commission_rate_applied is null or commission_rate_applied between 0 and 100)
);

create trigger projects_set_updated_at before update on public.projects
for each row execute function public.set_updated_at();

create or replace function public.protect_project_financial_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.commission_locked_at is not null
     and (new.final_price is distinct from old.final_price
          or new.employee_id is distinct from old.employee_id) then
    raise exception 'A commissioned project keeps its historical value and employee';
  end if;

  if current_user = 'authenticated' and not public.is_admin() then
    if new.payment_amount is distinct from old.payment_amount
       or new.payment_status is distinct from old.payment_status
       or new.payment_date is distinct from old.payment_date
       or new.commission_rate_applied is distinct from old.commission_rate_applied
       or new.commission_amount is distinct from old.commission_amount
       or new.bonus_amount is distinct from old.bonus_amount
       or new.commission_locked_at is distinct from old.commission_locked_at then
      raise exception 'Financial totals and commission snapshots are managed by the database';
    end if;
  end if;
  return new;
end;
$$;

create trigger projects_protect_financials
before update on public.projects
for each row execute function public.protect_project_financial_fields();

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete restrict,
  amount numeric(14,3) not null check (amount > 0),
  currency text not null default 'TND',
  payment_method public.payment_method not null,
  payment_date date not null default current_date,
  reference text,
  notes text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.commission_rules (
  id uuid primary key default gen_random_uuid(),
  min_projects integer not null check (min_projects >= 0),
  max_projects integer check (max_projects is null or max_projects >= min_projects),
  commission_percentage numeric(5,2) not null check (commission_percentage between 0 and 100),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index commission_rules_unique_range
on public.commission_rules (min_projects, coalesce(max_projects, 2147483647));

create or replace function public.prevent_overlapping_commission_rules()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.is_active and exists (
    select 1
    from public.commission_rules existing
    where existing.is_active
      and existing.id <> new.id
      and int4range(existing.min_projects, coalesce(existing.max_projects, 2147483646), '[]')
          && int4range(new.min_projects, coalesce(new.max_projects, 2147483646), '[]')
  ) then
    raise exception 'Active commission rule ranges cannot overlap';
  end if;
  return new;
end;
$$;

create trigger commission_rules_prevent_overlap
before insert or update on public.commission_rules
for each row execute function public.prevent_overlapping_commission_rules();

create trigger commission_rules_set_updated_at before update on public.commission_rules
for each row execute function public.set_updated_at();

create table public.bonus_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  min_project_value numeric(14,3) not null check (min_project_value >= 0),
  bonus_amount numeric(14,3) not null check (bonus_amount >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger bonus_rules_set_updated_at before update on public.bonus_rules
for each row execute function public.set_updated_at();

create table public.project_bonus_awards (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects(id) on delete restrict,
  employee_id uuid not null references public.profiles(id) on delete restrict,
  bonus_rule_id uuid references public.bonus_rules(id) on delete set null,
  rule_name_snapshot text not null,
  project_value_snapshot numeric(14,3) not null,
  bonus_amount numeric(14,3) not null check (bonus_amount >= 0),
  awarded_at timestamptz not null default now()
);

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.notifications (
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

create index clients_created_by_idx on public.clients(created_by);
create index clients_sales_status_idx on public.clients(sales_status);
create index clients_service_type_idx on public.clients(service_type);
create index clients_created_at_idx on public.clients(created_at desc);
create index interactions_client_id_idx on public.interactions(client_id);
create index interactions_employee_id_idx on public.interactions(employee_id);
create index interactions_date_idx on public.interactions(date desc);
create index projects_client_id_idx on public.projects(client_id);
create index projects_employee_id_idx on public.projects(employee_id);
create index projects_status_idx on public.projects(status);
create index projects_payment_status_idx on public.projects(payment_status);
create index payments_project_id_idx on public.payments(project_id);
create index payments_payment_date_idx on public.payments(payment_date desc);
create index activity_logs_user_id_idx on public.activity_logs(user_id);
create index activity_logs_created_at_idx on public.activity_logs(created_at desc);
create index notifications_recipient_idx on public.notifications(recipient_id, read_at, created_at desc);

create or replace function public.get_employee_commission_rate(p_employee_id uuid)
returns numeric
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  project_count integer;
  result_rate numeric;
begin
  if p_employee_id is distinct from public.current_profile_id() and not public.is_admin() then
    raise exception 'Access denied';
  end if;

  select count(*)::integer into project_count
  from public.projects
  where employee_id = p_employee_id and commission_locked_at is not null;

  select commission_percentage into result_rate
  from public.commission_rules
  where is_active
    and min_projects <= project_count
    and (max_projects is null or project_count <= max_projects)
  order by min_projects desc
  limit 1;

  return coalesce(result_rate, 0);
end;
$$;

create or replace function public.sync_project_financials(p_project_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  paid_total numeric(14,3);
  project_record public.projects%rowtype;
  eligible_count integer;
  applied_rate numeric(5,2);
  bonus_record public.bonus_rules%rowtype;
begin
  select coalesce(sum(amount), 0) into paid_total
  from public.payments where project_id = p_project_id;

  select * into project_record from public.projects where id = p_project_id for update;
  if not found then return; end if;

  update public.projects
  set payment_amount = paid_total,
      payment_status = case
        when paid_total <= 0 then 'Not Paid'::public.payment_status
        when paid_total < final_price then 'Partially Paid'::public.payment_status
        else 'Paid'::public.payment_status
      end,
      payment_date = case when paid_total >= final_price and final_price > 0 then current_date else payment_date end
  where id = p_project_id
  returning * into project_record;

  if project_record.payment_status = 'Paid'
     and project_record.final_price > 0
     and project_record.commission_locked_at is null then
    select count(*)::integer + 1 into eligible_count
    from public.projects
    where employee_id = project_record.employee_id
      and commission_locked_at is not null
      and id <> project_record.id;

    select commission_percentage into applied_rate
    from public.commission_rules
    where is_active
      and min_projects <= eligible_count
      and (max_projects is null or eligible_count <= max_projects)
    order by min_projects desc
    limit 1;

    select * into bonus_record
    from public.bonus_rules
    where is_active and min_project_value <= project_record.final_price
    order by min_project_value desc
    limit 1;

    if bonus_record.id is not null then
      insert into public.project_bonus_awards (
        project_id, employee_id, bonus_rule_id, rule_name_snapshot,
        project_value_snapshot, bonus_amount
      ) values (
        project_record.id, project_record.employee_id, bonus_record.id,
        bonus_record.name, project_record.final_price, bonus_record.bonus_amount
      ) on conflict (project_id) do nothing;
    end if;

    update public.projects
    set commission_rate_applied = coalesce(applied_rate, 0),
        commission_amount = round(least(paid_total, project_record.final_price) * coalesce(applied_rate, 0) / 100, 3),
        bonus_amount = coalesce(bonus_record.bonus_amount, 0),
        commission_locked_at = now()
    where id = project_record.id;
  end if;
end;
$$;

create or replace function public.on_payment_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.sync_project_financials(old.project_id);
    return old;
  end if;

  perform public.sync_project_financials(new.project_id);
  if tg_op = 'UPDATE' and old.project_id is distinct from new.project_id then
    perform public.sync_project_financials(old.project_id);
  end if;
  return new;
end;
$$;

create trigger payments_sync_project
after insert or update or delete on public.payments
for each row execute function public.on_payment_changed();

create or replace function public.get_employee_earnings(p_employee_id uuid)
returns table (
  eligible_revenue numeric,
  total_commission numeric,
  total_bonuses numeric,
  total_earnings numeric,
  paid_projects bigint,
  current_rate numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if p_employee_id is distinct from public.current_profile_id() and not public.is_admin() then
    raise exception 'Access denied';
  end if;

  return query
  select
    coalesce(sum(p.payment_amount) filter (where p.commission_locked_at is not null), 0),
    coalesce(sum(p.commission_amount), 0),
    coalesce(sum(p.bonus_amount), 0),
    coalesce(sum(p.commission_amount + p.bonus_amount), 0),
    count(*) filter (where p.commission_locked_at is not null),
    public.get_employee_commission_rate(p_employee_id)
  from public.projects p
  where p.employee_id = p_employee_id;
end;
$$;

create or replace function public.audit_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  row_id uuid;
  action_name text;
begin
  if tg_op = 'DELETE' then
    row_id := old.id;
  else
    row_id := new.id;
  end if;
  action_name := lower(tg_table_name) || '.' || lower(tg_op);
  if tg_table_name = 'projects' and tg_op = 'UPDATE' then
    if new.status is distinct from old.status then
      action_name := 'project.status_changed';
    end if;
  end if;
  insert into public.activity_logs (user_id, action, entity_type, entity_id, metadata)
  values (
    public.current_profile_id(), action_name, tg_table_name, row_id,
    jsonb_build_object('operation', tg_op)
  );
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger audit_clients after insert or update on public.clients
for each row execute function public.audit_change();
create trigger audit_interactions after insert on public.interactions
for each row execute function public.audit_change();
create trigger audit_projects after insert or update on public.projects
for each row execute function public.audit_change();
create trigger audit_payments after insert or update or delete on public.payments
for each row execute function public.audit_change();
create trigger audit_commission_rules after insert or update or delete on public.commission_rules
for each row execute function public.audit_change();
create trigger audit_bonus_rules after insert or update or delete on public.bonus_rules
for each row execute function public.audit_change();

alter table public.profiles enable row level security;
alter table public.app_settings enable row level security;
alter table public.clients enable row level security;
alter table public.interactions enable row level security;
alter table public.projects enable row level security;
alter table public.payments enable row level security;
alter table public.commission_rules enable row level security;
alter table public.bonus_rules enable row level security;
alter table public.project_bonus_awards enable row level security;
alter table public.activity_logs enable row level security;
alter table public.notifications enable row level security;

create policy profiles_select on public.profiles for select to authenticated
using (user_id = auth.uid() or public.is_admin());
create policy profiles_insert on public.profiles for insert to authenticated
with check (public.is_admin());
create policy profiles_update on public.profiles for update to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());
create policy profiles_delete on public.profiles for delete to authenticated
using (public.is_admin());

create policy settings_select on public.app_settings for select to authenticated using (true);
create policy settings_admin_all on public.app_settings for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy clients_select on public.clients for select to authenticated
using (created_by = public.current_profile_id() or public.is_admin());
create policy clients_insert on public.clients for insert to authenticated
with check (created_by = public.current_profile_id() or public.is_admin());
create policy clients_update on public.clients for update to authenticated
using (created_by = public.current_profile_id() or public.is_admin())
with check (created_by = public.current_profile_id() or public.is_admin());
create policy clients_delete on public.clients for delete to authenticated using (public.is_admin());

create policy interactions_select on public.interactions for select to authenticated
using (employee_id = public.current_profile_id() or public.is_admin());
create policy interactions_insert on public.interactions for insert to authenticated
with check (
  public.is_admin() or (
    employee_id = public.current_profile_id()
    and exists (select 1 from public.clients c where c.id = client_id and c.created_by = public.current_profile_id())
  )
);
create policy interactions_update on public.interactions for update to authenticated
using (employee_id = public.current_profile_id() or public.is_admin())
with check (employee_id = public.current_profile_id() or public.is_admin());
create policy interactions_delete on public.interactions for delete to authenticated using (public.is_admin());

create policy projects_select on public.projects for select to authenticated
using (employee_id = public.current_profile_id() or public.is_admin());
create policy projects_insert on public.projects for insert to authenticated
with check (
  public.is_admin() or (
    employee_id = public.current_profile_id()
    and exists (select 1 from public.clients c where c.id = client_id and c.created_by = public.current_profile_id())
  )
);
create policy projects_update on public.projects for update to authenticated
using (employee_id = public.current_profile_id() or public.is_admin())
with check (employee_id = public.current_profile_id() or public.is_admin());
create policy projects_delete on public.projects for delete to authenticated using (public.is_admin());

create policy payments_select on public.payments for select to authenticated
using (
  public.is_admin() or exists (
    select 1 from public.projects p
    where p.id = project_id and p.employee_id = public.current_profile_id()
  )
);
create policy payments_insert on public.payments for insert to authenticated
with check (
  created_by = public.current_profile_id()
  and (public.is_admin() or exists (
    select 1 from public.projects p
    where p.id = project_id and p.employee_id = public.current_profile_id()
  ))
);
create policy payments_update on public.payments for update to authenticated
using (public.is_admin()) with check (public.is_admin());
create policy payments_delete on public.payments for delete to authenticated using (public.is_admin());

create policy commission_rules_select on public.commission_rules for select to authenticated
using (is_active or public.is_admin());
create policy commission_rules_admin on public.commission_rules for all to authenticated
using (public.is_admin()) with check (public.is_admin());
create policy bonus_rules_select on public.bonus_rules for select to authenticated
using (is_active or public.is_admin());
create policy bonus_rules_admin on public.bonus_rules for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy awards_select on public.project_bonus_awards for select to authenticated
using (employee_id = public.current_profile_id() or public.is_admin());

create policy activity_select on public.activity_logs for select to authenticated
using (user_id = public.current_profile_id() or public.is_admin());

create policy notifications_select on public.notifications for select to authenticated
using (recipient_id = public.current_profile_id() or public.is_admin());
create policy notifications_update on public.notifications for update to authenticated
using (recipient_id = public.current_profile_id() or public.is_admin())
with check (recipient_id = public.current_profile_id() or public.is_admin());
create policy notifications_admin_insert on public.notifications for insert to authenticated
with check (public.is_admin());
create policy notifications_admin_delete on public.notifications for delete to authenticated
using (public.is_admin());

revoke all on all tables in schema public from anon;
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on function public.current_profile_id() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.get_employee_commission_rate(uuid) to authenticated;
grant execute on function public.get_employee_earnings(uuid) to authenticated;
revoke execute on function public.sync_project_financials(uuid) from public, anon, authenticated;

insert into public.app_settings (id, company_name, currency, locale)
values (true, 'CRM Tunisie', 'TND', 'fr-TN')
on conflict (id) do nothing;

insert into public.commission_rules (min_projects, max_projects, commission_percentage) values
  (0, 4, 10),
  (5, 9, 15),
  (10, 19, 20),
  (20, null, 25);

insert into public.bonus_rules (name, min_project_value, bonus_amount) values
  ('Projet 1 000 TND+', 1000, 100),
  ('Projet 3 000 TND+', 3000, 300),
  ('Projet 5 000 TND+', 5000, 500),
  ('Projet 10 000 TND+', 10000, 1000);

-- After creating the first user in Supabase Authentication, promote it once:
-- update public.profiles set role = 'admin' where email = 'admin@votreentreprise.tn';
