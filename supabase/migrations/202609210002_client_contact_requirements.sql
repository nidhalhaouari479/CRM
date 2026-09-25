-- Compatibility migration when 202609210001 was already applied.
-- Agency name, phone and service are required. Contact identity and email are optional.

alter table public.clients
  add column if not exists contact_position text;

-- For an individual record, the person's name is a safe agency/display-name fallback.
update public.clients
set company_name = contact_name
where nullif(btrim(company_name), '') is null
  and client_type = 'Individual'
  and nullif(btrim(contact_name), '') is not null;

do $$
begin
  if exists (
    select 1
    from public.clients
    where nullif(btrim(company_name), '') is null
  ) then
    raise exception 'Every existing client needs an agency name before applying this migration';
  end if;

  if exists (
    select 1
    from public.clients
    where nullif(btrim(phone), '') is null
  ) then
    raise exception 'Every existing client needs a phone number before applying this migration';
  end if;
end;
$$;

alter table public.clients
  drop constraint if exists clients_founder_name_not_blank,
  drop constraint if exists clients_company_name_not_blank,
  drop constraint if exists clients_phone_not_blank,
  drop constraint if exists clients_service_type_not_blank,
  drop constraint if exists clients_contact_position_not_blank;

alter table public.clients
  drop column if exists founder_name,
  alter column company_name set not null,
  alter column phone set not null,
  alter column contact_name drop not null,
  alter column email drop not null,
  alter column business_sector drop not null,
  add constraint clients_company_name_not_blank check (nullif(btrim(company_name), '') is not null),
  add constraint clients_phone_not_blank check (nullif(btrim(phone), '') is not null),
  add constraint clients_service_type_not_blank check (nullif(btrim(service_type), '') is not null),
  add constraint clients_contact_position_not_blank check (nullif(btrim(contact_position), '') is not null);
