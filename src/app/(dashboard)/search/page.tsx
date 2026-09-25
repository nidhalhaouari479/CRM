import { frenchLabel } from "@/lib/labels";
import Link from "next/link";
import { BriefcaseBusiness, Contact, Search, UserRound } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Client, Profile, Project } from "@/lib/types";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const profile = await requireProfile();
  const { q = "" } = await searchParams;
  const term = q.toLowerCase().trim();
  const supabase = await createClient();
  const [
    { data: clientsData },
    { data: projectsData },
    { data: profilesData },
  ] = await Promise.all([
    supabase.from("clients").select("*").limit(100),
    supabase.from("projects").select("*").limit(100),
    profile.role === "admin"
      ? supabase.from("profiles").select("*").limit(100)
      : Promise.resolve({ data: [] }),
  ]);
  const clients = ((clientsData ?? []) as Client[]).filter((c) =>
    `${c.client_code} ${c.company_name} ${c.contact_name ?? ""} ${c.contact_position ?? ""} ${c.business_sector ?? ""} ${c.email ?? ""} ${c.phone}`
      .toLowerCase()
      .includes(term),
  );
  const projects = ((projectsData ?? []) as Project[]).filter((p) =>
    `${p.name} ${frenchLabel(p.service_type)}`.toLowerCase().includes(term),
  );
  const profiles = ((profilesData ?? []) as Profile[]).filter((p) =>
    `${p.first_name} ${p.last_name} ${p.email}`.toLowerCase().includes(term),
  );
  return (
    <div className="space-y-6">
      <PageHeader
        title={`Recherche : ${q || "—"}`}
        description={`${clients.length + projects.length + profiles.length} résultat(s)`}
      />
      {!term ? (
        <Card>
          <CardContent className="flex min-h-64 flex-col items-center justify-center text-slate-500">
            <Search className="mb-3 size-8" />
            Saisissez un terme dans la barre de recherche.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          <ResultCard title="Clients" icon={Contact}>
            {clients.map((c) => (
              <Link
                key={c.id}
                href={`/clients/${c.id}`}
                className="block rounded-lg border p-3 text-sm hover:border-blue-300 hover:bg-blue-50"
              >
                <strong>{c.company_name}</strong>
                <span className="mt-1 block text-xs text-slate-500">
                  {c.client_code} ·{" "}
                  {c.business_sector || "Secteur non renseigné"} ·{" "}
                  {frenchLabel(c.service_type)}
                </span>
              </Link>
            ))}
          </ResultCard>
          <ResultCard title="Projets" icon={BriefcaseBusiness}>
            {projects.map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="block rounded-lg border p-3 text-sm hover:border-blue-300 hover:bg-blue-50"
              >
                <strong>{p.name}</strong>
                <span className="mt-1 block text-xs text-slate-500">
                  {frenchLabel(p.service_type)} · {frenchLabel(p.status)}
                </span>
              </Link>
            ))}
          </ResultCard>
          {profile.role === "admin" && (
            <ResultCard title="Employés" icon={UserRound}>
              {profiles.map((p) => (
                <Link
                  key={p.id}
                  href={`/admin/employees/${p.id}`}
                  className="block rounded-lg border p-3 text-sm hover:border-blue-300 hover:bg-blue-50"
                >
                  <strong>
                    {p.first_name} {p.last_name}
                  </strong>
                  <span className="mt-1 block text-xs text-slate-500">
                    {p.email}
                  </span>
                </Link>
              ))}
            </ResultCard>
          )}
        </div>
      )}
    </div>
  );
}
function ResultCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Contact;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="size-4 text-blue-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">{children}</CardContent>
    </Card>
  );
}
