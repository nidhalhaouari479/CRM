import { frenchLabel } from "@/lib/labels";
import Link from "next/link";
import { BriefcaseBusiness, Contact, Search, UserRound } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Client, Profile, Project } from "@/lib/types";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { EntityAvatar } from "@/components/entity-avatar";

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
        <EmptyState
          icon={Search}
          title="Aucun terme de recherche"
          description="Saisissez un terme dans la barre de recherche."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <ResultCard title="Clients" icon={Contact} count={clients.length}>
            {clients.map((c) => (
              <ResultLink
                key={c.id}
                href={`/clients/${c.id}`}
                name={c.company_name}
                meta={`${c.client_code} · ${c.business_sector || "Secteur non renseigné"} · ${frenchLabel(c.service_type)}`}
              />
            ))}
          </ResultCard>
          <ResultCard
            title="Projets"
            icon={BriefcaseBusiness}
            count={projects.length}
          >
            {projects.map((p) => (
              <ResultLink
                key={p.id}
                href={`/projects/${p.id}`}
                name={p.name}
                meta={`${frenchLabel(p.service_type)} · ${frenchLabel(p.status)}`}
              />
            ))}
          </ResultCard>
          {profile.role === "admin" && (
            <ResultCard
              title="Employés"
              icon={UserRound}
              count={profiles.length}
            >
              {profiles.map((p) => (
                <ResultLink
                  key={p.id}
                  href={`/admin/employees/${p.id}`}
                  name={`${p.first_name} ${p.last_name}`}
                  meta={p.email}
                />
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
  count,
  children,
}: {
  title: string;
  icon: typeof Contact;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <Card className="gap-0 pb-0">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <Icon aria-hidden="true" className="size-4 text-primary" />
          {title}
          <span className="tabular ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {count}
          </span>
        </CardTitle>
      </CardHeader>
      {count ? (
        <ul className="divide-y">{children}</ul>
      ) : (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">
          Aucun résultat.
        </p>
      )}
    </Card>
  );
}
function ResultLink({
  href,
  name,
  meta,
}: {
  href: string;
  name: string;
  meta: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-accent"
      >
        <EntityAvatar name={name} />
        <span className="min-w-0">
          <span className="block truncate font-semibold text-foreground">
            {name}
          </span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
            {meta}
          </span>
        </span>
      </Link>
    </li>
  );
}
