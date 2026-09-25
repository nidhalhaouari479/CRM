-- Un téléphone ou un courriel ne peut appartenir qu’à un seul client.
begin;

create or replace function public.client_phone_key(value text)
returns text language sql immutable strict parallel safe
set search_path = pg_catalog
as $$
  select nullif(regexp_replace(regexp_replace(value, '[^0-9]', '', 'g'), '^00', ''), '');
$$;

-- Empêche les écritures concurrentes pendant le contrôle des données existantes.
lock table public.clients in share row exclusive mode;

do $$
begin
  if exists (
    select 1 from public.clients
    group by public.client_phone_key(phone)
    having count(*) > 1 and public.client_phone_key(phone) is not null
  ) then
    raise exception 'Des clients ont le même téléphone. Corrigez les doublons avant de relancer cette migration.';
  end if;
  if exists (
    select 1 from public.clients
    group by nullif(lower(btrim(email)), '')
    having count(*) > 1 and nullif(lower(btrim(email)), '') is not null
  ) then
    raise exception 'Des clients ont le même courriel. Corrigez les doublons avant de relancer cette migration.';
  end if;
end;
$$;

alter table public.clients
  add constraint clients_phone_digits_required
  check (public.client_phone_key(phone) is not null);

create unique index clients_phone_unique
  on public.clients (public.client_phone_key(phone));

create unique index clients_email_unique
  on public.clients (nullif(lower(btrim(email)), ''));

commit;
