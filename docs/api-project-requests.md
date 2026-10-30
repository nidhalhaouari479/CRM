# API — Formulaire « Project Request » du site web

Les demandes envoyées depuis le formulaire du site web sont enregistrées dans Supabase (table `project_requests`) et affichées dans le CRM, page **Demandes web** (`/project-requests`).

```
Navigateur ──► Site web (route serveur) ──► CRM  POST /api/project-requests ──► Supabase
                    │ ajoute la clé secrète
```

> ⚠️ La clé API est secrète. Le formulaire ne doit **jamais** appeler le CRM directement depuis le navigateur : il appelle une route serveur du site web, qui ajoute la clé et transmet la demande au CRM.

---

## 1. Variables d’environnement

### Dans le CRM (`.env` / Vercel)

```dotenv
PROJECT_REQUESTS_API_KEY=<cle_longue_aleatoire>
```

### Dans le site web (`.env.local` / Vercel du site)

```dotenv
CRM_API_URL=https://crm.votre-domaine.com
CRM_API_KEY=<exactement la meme valeur que PROJECT_REQUESTS_API_KEY>
```

Ne préfixez **pas** ces variables par `NEXT_PUBLIC_` : elles ne doivent exister que côté serveur.

---

## 2. Référence de l’API

`POST {CRM_API_URL}/api/project-requests`

### En-têtes

| En-tête | Valeur |
| --- | --- |
| `Content-Type` | `application/json` |
| `x-api-key` | `CRM_API_KEY` (ou `Authorization: Bearer CRM_API_KEY`) |

### Corps JSON

| Champ | Champ du formulaire | Obligatoire | Règle |
| --- | --- | --- | --- |
| `name` | Name | oui | 2 à 120 caractères |
| `company` | Company | non | max 160 |
| `email` | Email Address | oui | e-mail valide |
| `phone` | Phone Number | non | max 40 |
| `project_type` | Project Type | oui | texte de l’option choisie, max 120 |
| `timeline` | Timeline | non | texte de l’option choisie, max 120 |
| `budget` | Budget | non | texte de l’option choisie, max 120 |
| `message` | Message | oui | 10 à 5000 caractères |
| `source` | — | non | page d’origine, ex. `https://site.com/contact` |
| `website` | — | non | champ piège anti-robot caché, doit rester vide |

Exemple :

```json
{
  "name": "Sami Ben Ali",
  "company": "Acme SARL",
  "email": "sami@acme.tn",
  "phone": "+216 29 897 262",
  "project_type": "E-commerce",
  "timeline": "1 - 3 mois",
  "budget": "5 000 - 10 000 TND",
  "message": "Nous voulons une boutique en ligne avec paiement par carte.",
  "source": "https://cdf-solution.com/contact"
}
```

### Réponses

| Code | Signification | Corps |
| --- | --- | --- |
| `201` | Demande enregistrée | `{ "id": "uuid", "created_at": "..." }` |
| `400` | JSON invalide | `{ "error": "..." }` |
| `401` | Clé absente ou incorrecte | `{ "error": "Non autorise." }` |
| `422` | Champs invalides | `{ "error": "...", "fields": { "email": ["..."] } }` |
| `500` | Erreur serveur | `{ "error": "..." }` |

Test rapide :

```bash
curl -X POST "$CRM_API_URL/api/project-requests" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $CRM_API_KEY" \
  -d '{"name":"Test","email":"test@example.com","project_type":"Website","message":"Message de test du formulaire."}'
```

---

## 3. Intégration dans le site web (Next.js App Router)

### 3.1 Route serveur proxy — `app/api/project-request/route.ts`

```ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }

  const response = await fetch(`${process.env.CRM_API_URL}/api/project-requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.CRM_API_KEY!,
    },
    body: JSON.stringify({
      ...body,
      source: request.headers.get("referer") ?? undefined,
    }),
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));
  return NextResponse.json(data, { status: response.status });
}
```

### 3.2 Envoi depuis le formulaire (composant client)

Chaque champ du formulaire doit avoir l’attribut `name` correspondant au tableau ci-dessus (`name`, `company`, `email`, `phone`, `project_type`, `timeline`, `budget`, `message`). Ajoutez le champ piège invisible :

```tsx
<input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" />
```

```tsx
"use client";

import { useState } from "react";

export function ProjectRequestForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form));

    const response = await fetch("/api/project-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      form.reset();
      setErrors({});
      setState("sent");
      return;
    }
    const data = await response.json().catch(() => ({}));
    setErrors(data.fields ?? {});
    setState("error");
  }

  return (
    <form onSubmit={onSubmit}>
      {/* ... champs existants avec les attributs name ci-dessus ... */}
      <button type="submit" disabled={state === "sending"}>
        {state === "sending" ? "Envoi..." : "Submit Project Request"}
      </button>
      {state === "sent" && <p>Merci ! Nous vous répondons sous un jour ouvré.</p>}
      {state === "error" && <p>Vérifiez les champs et réessayez.</p>}
    </form>
  );
}
```

Pour les listes déroulantes, envoyez le texte lisible de l’option (ex. `value="E-commerce"`) : c’est ce qui s’affiche dans le CRM. Laissez l’option « Select a Service » avec `value=""`.

---

## 4. Côté CRM

- Exécuter la migration `supabase/migrations/202610300002_project_requests.sql` dans Supabase.
- Chaque nouvelle demande crée une notification pour les administrateurs actifs.
- Dans **Demandes web**, tous les collaborateurs voient les demandes et changent leur statut : Nouveau → Contacté → Converti / Perdu. Seuls les administrateurs peuvent supprimer.
