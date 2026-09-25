-- Optional demo data. Create at least one admin and one employee in Authentication first.
do $$
declare
  owner_id uuid;
  owner_2 uuid;
  owner_3 uuid;
  client_a uuid;
  client_b uuid;
  project_a uuid;
  project_b uuid;
  project_c uuid;
begin
  select id into owner_id from public.profiles where is_active order by (role = 'employee') desc, created_at limit 1;
  if owner_id is null then
    raise notice 'No profile found. Create Auth users before running seed.sql.';
    return;
  end if;
  select id into owner_2 from public.profiles where is_active and id <> owner_id order by (role = 'employee') desc, created_at limit 1;
  select id into owner_3 from public.profiles where is_active and id not in (owner_id, coalesce(owner_2, owner_id)) order by (role = 'employee') desc, created_at limit 1;
  owner_2 := coalesce(owner_2, owner_id);
  owner_3 := coalesce(owner_3, owner_2, owner_id);

  insert into public.clients (
    created_by, company_name, contact_name, contact_position, business_sector, phone, email, city,
    client_type, service_type, estimated_budget, sales_status, priority, notes
  ) values (
    owner_id, 'Carthage Immobilier', 'Amine Trabelsi', 'Gérant', 'Construction / Immobilier', '+216 22 145 780',
    'amine@carthage-immo.tn', 'Tunis', 'Company', 'Website / Showcase Website',
    4500, 'In Discussion', 'High', 'Refonte du site et génération de prospects.'
  ) returning id into client_a;

  insert into public.clients (
    created_by, company_name, contact_name, contact_position, business_sector, phone, email, city,
    client_type, service_type, estimated_budget, sales_status, priority
  ) values (
    owner_id, 'Medina Market', 'Sarra Gharbi', 'Responsable e-commerce', 'Commerce', '+216 55 312 900',
    'sarra@medinamarket.tn', 'Sousse', 'Company', 'E-commerce',
    8000, 'Confirmed', 'Medium'
  ) returning id into client_b;

  insert into public.clients (
    created_by, company_name, contact_name, contact_position, business_sector, phone, email, city,
    client_type, service_type, estimated_budget, sales_status, priority
  ) values
    (owner_2, 'Oliva Export', 'Fares Jaziri', 'Fondateur', 'Agriculture', '+216 20 440 811', 'fares@oliva-export.tn', 'Sfax', 'Company', 'ERP', 15000, 'Contacted', 'High'),
    (owner_3, 'Clinique El Amen', 'Dr. Leila Mansour', 'Directrice', 'Santé', '+216 71 890 200', 'leila@elamen.tn', 'Tunis', 'Company', 'CRM', 12000, 'Confirmed', 'High'),
    (owner_id, 'Atelier Jasmin', 'Rim Khelifi', 'Responsable commerciale', 'Commerce', '+216 98 120 456', 'rim@atelierjasmin.tn', 'Nabeul', 'Company', 'E-commerce', 6200, 'Waiting', 'Medium'),
    (owner_2, 'Bizerte Marine', 'Youssef Ben Amor', 'Responsable opérations', 'Transport / Logistique', '+216 52 760 310', 'youssef@bizertemarine.tn', 'Bizerte', 'Company', 'Custom Software', 18000, 'In Discussion', 'High'),
    (owner_3, 'Nour Digital', null, null, 'Technologie', '+216 27 540 219', null, 'Monastir', 'Individual', 'Mobile Application', 9000, 'New', 'Medium'),
    (owner_id, 'Djerba Events', 'Meriem Bouaziz', 'Fondatrice', 'Hôtellerie / Tourisme', '+216 93 201 775', 'meriem@djerbaevents.tn', 'Djerba', 'Company', 'Automation', 3500, 'Converted', 'Low'),
    (owner_2, 'Nord Café', 'Walid Chaabane', 'Gérant', 'Hôtellerie / Tourisme', '+216 29 665 040', 'walid@nordcafe.tn', 'Ariana', 'Company', 'Website / Showcase Website', 2800, 'Lost', 'Low'),
    (owner_3, 'EduPlus Tunisie', 'Ines Ayari', 'Responsable pédagogique', 'Éducation', '+216 55 873 120', 'ines@eduplus.tn', 'Tunis', 'Company', 'SaaS', 22000, 'Contacted', 'High');

  insert into public.interactions (
    client_id, employee_id, type, objective, duration_minutes, result,
    conclusion, interest_score, next_action
  ) values (
    client_a, owner_id, 'Telephone', 'Premier echange', 18,
    'Le client souhaite moderniser sa presence en ligne.',
    'Client interesse par un site vitrine avec formulaire de demande de visite.',
    8,
    'Envoyer la proposition commerciale.'
  );

  insert into public.interactions (
    client_id, employee_id, type, objective, duration_minutes, result,
    conclusion, interest_score, next_action
  ) values
    (client_a, owner_id, 'Email', 'Proposition commerciale', null, 'Proposition envoyee avec deux options de realisation.', 'Documents et references transmis.', 7, 'Confirmer la reception.'),
    (client_a, owner_id, 'Meeting face a face', 'Reunion de cadrage', 45, 'Validation des objectifs du site et des cibles prioritaires.', 'Perimetre fonctionnel clarifie.', 9, 'Preparer les maquettes.'),
    (client_b, owner_id, 'Message', 'Validation du catalogue', null, 'Le client a valide la structure des categories.', 'Planning de saisie partage.', 8, 'Recevoir le fichier produits.'),
    (client_b, owner_id, 'Meeting en ligne', 'Demonstration du prototype', 35, 'Parcours de commande et espace client presentes.', 'Retours consignes dans le projet.', 8, 'Livrer la deuxieme version.');

  insert into public.projects (
    client_id, employee_id, name, service_type, description,
    estimated_price, final_price, status, start_date, expected_end_date
  ) values (
    client_b, owner_id, 'Boutique Medina Market', 'E-commerce',
    'Catalogue, paiement en ligne et gestion des commandes.',
    8000, 7500, 'In Progress', current_date, current_date + 45
  ) returning id into project_a;

  insert into public.projects (
    client_id, employee_id, name, service_type, description,
    estimated_price, final_price, status, start_date, expected_end_date
  ) values (
    client_a, owner_id, 'Site Carthage Immobilier', 'Website / Showcase Website',
    'Site multilingue et formulaires de demande de visite.', 4500, 4200,
    'Confirmed', current_date - 10, current_date + 25
  ) returning id into project_b;

  insert into public.projects (
    client_id, employee_id, name, service_type, description,
    estimated_price, final_price, status, start_date, expected_end_date
  ) values (
    client_b, owner_id, 'Automatisation des commandes', 'Automation',
    'Synchronisation du stock et notifications de préparation.', 3200, 3000,
    'Completed', current_date - 60, current_date - 5
  ) returning id into project_c;

  insert into public.payments (project_id, amount, payment_method, reference, created_by)
  values (project_a, 3000, 'Bank Transfer', 'VIR-DEMO-001', owner_id);

  insert into public.payments (project_id, amount, payment_method, reference, created_by) values
    (project_a, 1000, 'Bank Transfer', 'VIR-DEMO-002', owner_id),
    (project_b, 1200, 'Card', 'CB-DEMO-003', owner_id),
    (project_c, 1500, 'Bank Transfer', 'VIR-DEMO-004', owner_id),
    (project_c, 1500, 'Cash', 'CAISSE-DEMO-005', owner_id);
end $$;
