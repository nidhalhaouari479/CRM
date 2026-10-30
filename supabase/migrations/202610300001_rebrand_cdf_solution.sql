alter table public.app_settings
  alter column company_name set default 'CRM CDF-Solution';

update public.app_settings
set company_name = 'CRM CDF-Solution'
where company_name = 'CRM Tunisie';
