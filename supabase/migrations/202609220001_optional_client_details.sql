-- Align database checks with the optional contact details in the client form.
-- Earlier NOT NULL changes did not remove CHECK constraints rejecting NULL.
begin;

alter table public.clients
  alter column contact_name drop not null,
  alter column contact_position drop not null,
  alter column email drop not null,
  alter column business_sector drop not null,
  drop constraint if exists clients_contact_position_not_blank,
  drop constraint if exists clients_email_not_blank,
  drop constraint if exists clients_business_sector_not_blank;

alter table public.clients
  add constraint clients_contact_position_not_blank check (
    contact_position is null or nullif(btrim(contact_position), '') is not null
  ),
  add constraint clients_email_not_blank check (
    email is null or nullif(btrim(email), '') is not null
  ),
  add constraint clients_business_sector_not_blank check (
    business_sector is null or nullif(btrim(business_sector), '') is not null
  );

commit;
