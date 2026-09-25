const fs = require("fs");

const path = "supabase/seed.sql";
const content = fs.readFileSync(path, "utf8");
const start = content.indexOf("  insert into public.interactions");
const end = content.indexOf("  insert into public.projects", start);

if (start === -1 || end === -1) {
  throw new Error("Seed interaction block not found");
}

const replacement = `  insert into public.interactions (
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

`;

fs.writeFileSync(
  path,
  content.slice(0, start) + replacement + content.slice(end),
);
