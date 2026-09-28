begin;

alter table public.clients
  alter column phone drop not null,
  drop constraint if exists clients_phone_not_blank,
  drop constraint if exists clients_phone_digits_required,
  drop constraint if exists clients_email_or_phone_required;

alter table public.clients
  add constraint clients_phone_not_blank check (
    phone is null or public.client_phone_key(phone) is not null
  ),
  add constraint clients_email_or_phone_required check (
    public.client_phone_key(phone) is not null
    or nullif(btrim(email), '') is not null
  );

commit;
