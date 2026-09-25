-- Simplify CRM interactions into one table with only the requested fields.
begin;

drop table if exists public.calls cascade;
drop table if exists public.emails cascade;
drop table if exists public.messages cascade;
drop table if exists public.meetings cascade;

drop function if exists public.create_interaction_with_details(
  uuid,
  public.interaction_kind,
  text,
  timestamptz,
  integer,
  text,
  text,
  text,
  text,
  timestamptz,
  jsonb
);
drop function if exists public.assert_interaction_detail_type();

alter table public.interactions
  add column objective text,
  add column result text,
  add column conclusion text,
  add column interest_score integer;

update public.interactions
set
  objective = coalesce(nullif(btrim(subject), ''), 'Objectif non renseigne'),
  result = coalesce(nullif(btrim(concat_ws(E'\n', client_request, employee_response)), ''), ''),
  conclusion = coalesce(nullif(btrim(summary), ''), 'Conclusion non renseignee'),
  interest_score = 0;

create type public.interaction_kind_new as enum (
  'Message',
  'Email',
  'Telephone',
  'Meeting en ligne',
  'Meeting face a face'
);

alter table public.interactions
  alter column type type public.interaction_kind_new
  using (
    case type::text
      when 'Call' then 'Telephone'
      when 'Email' then 'Email'
      when 'Meeting' then 'Meeting face a face'
      when 'Video Call' then 'Meeting en ligne'
      else 'Message'
    end
  )::public.interaction_kind_new;

drop type public.interaction_kind;
alter type public.interaction_kind_new rename to interaction_kind;

update public.interactions
set duration_minutes = null
where type in ('Message', 'Email');

update public.interactions
set duration_minutes = 0
where type in ('Telephone', 'Meeting en ligne', 'Meeting face a face')
  and duration_minutes is null;

alter table public.interactions
  alter column objective set not null,
  alter column result set not null,
  alter column result set default '',
  alter column conclusion set not null,
  alter column interest_score set not null,
  alter column interest_score set default 0,
  drop column subject,
  drop column summary,
  drop column client_request,
  drop column employee_response,
  drop column next_contact_date,
  add constraint interactions_interest_score_range
    check (interest_score between 0 and 10),
  add constraint interactions_duration_required_for_live_exchange
    check (
      type not in ('Telephone', 'Meeting en ligne', 'Meeting face a face')
      or duration_minutes is not null
    );

commit;
