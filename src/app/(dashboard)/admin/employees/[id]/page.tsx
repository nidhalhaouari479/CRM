import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BadgeDollarSign,
  BriefcaseBusiness,
  Clock3,
  CircleDollarSign,
  Contact,
  Gift,
  Percent,
} from "lucide-react";
import { frenchLabel } from "@/lib/labels";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate, formatDuration } from "@/lib/format";
import type { Client, LoginSession, Profile, Project } from "@/lib/types";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { EntityAvatar } from "@/components/entity-avatar";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Earnings {
  current_rate: number;
}

const dtClass =
  "text-xs font-medium uppercase tracking-wide text-muted-foreground";

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const [
    { data: profileData },
    { data: clientsData },
    { data: projectsData },
    { data: earningsData },
    { data: sessionsData },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).single(),
    supabase.from("clients").select("*").eq("created_by", id),
    supabase
      .from("projects")
      .select("*, clients!projects_client_id_fkey(company_name, contact_name)")
      .eq("employee_id", id)
      .order("created_at", { ascending: false }),
    supabase.rpc("get_employee_earnings", { p_employee_id: id }),
    supabase
      .from("login_sessions")
      .select("*")
      .eq("profile_id", id)
      .order("login_at", { ascending: false })
      .limit(20),
  ]);
  if (!profileData) notFound();
  const employee = profileData as Profile;
  const clients = (clientsData ?? []) as Client[];
  const projects = (projectsData ?? []) as unknown as Project[];
  const sessions = (sessionsData ?? []) as LoginSession[];
  const currentRate =
    (earningsData as unknown as Earnings[] | null)?.[0]?.current_rate ?? 0;
  const revenue = projects.reduce((s, p) => s + Number(p.payment_amount), 0),
    commission = projects.reduce((s, p) => s + Number(p.commission_amount), 0),
    bonus = projects.reduce((s, p) => s + Number(p.bonus_amount), 0);
  const fullName = `${employee.first_name} ${employee.last_name}`;
  return (
    <div className="space-y-6">
      <div className="space-y-6 border-b pb-6">
        <div className="flex items-center gap-4">
          <EntityAvatar name={fullName} className="size-12 text-sm" />
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold tracking-tight text-foreground md:text-[1.75rem]">
              {fullName}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="capitalize">{frenchLabel(employee.role)}</span>
              <span aria-hidden="true">·</span>
              <StatusBadge value={employee.is_active ? "Active" : "Inactive"} />
            </div>
          </div>
        </div>
        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="min-w-0">
            <dt className={dtClass}>Courriel</dt>
            <dd className="mt-1 truncate font-medium">{employee.email}</dd>
          </div>
          <div>
            <dt className={dtClass}>Téléphone</dt>
            <dd className="tabular mt-1 font-medium">
              {employee.phone || (
                <span className="text-subtle-foreground">Non renseigné</span>
              )}
            </dd>
          </div>
          <div>
            <dt className={dtClass}>Rôle</dt>
            <dd className="mt-1 font-medium capitalize">
              {frenchLabel(employee.role)}
            </dd>
          </div>
          <div>
            <dt className={dtClass}>Arrivée</dt>
            <dd className="tabular mt-1 font-medium">
              {formatDate(employee.created_at)}
            </dd>
          </div>
        </dl>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Clients" value={clients.length} icon={Contact} />
        <StatCard
          label="Projets"
          value={projects.length}
          icon={BriefcaseBusiness}
          tone="violet"
        />
        <StatCard
          label="Revenu généré"
          value={formatCurrency(revenue)}
          icon={CircleDollarSign}
          tone="green"
        />
        <StatCard
          label="Taux actuel"
          value={`${currentRate}%`}
          icon={Percent}
          tone="amber"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Commissions"
          value={formatCurrency(commission)}
          icon={BadgeDollarSign}
        />
        <StatCard
          label="Bonus"
          value={formatCurrency(bonus)}
          icon={Gift}
          tone="violet"
        />
        <StatCard
          label="Total gagné"
          value={formatCurrency(commission + bonus)}
          icon={CircleDollarSign}
          tone="green"
        />
      </div>
      <Card className="gap-0 py-0">
        <CardHeader className="border-b pt-4">
          <CardTitle>Projets de l’employé</CardTitle>
          <CardDescription>Détail des valeurs et rémunérations</CardDescription>
        </CardHeader>
        {projects.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Projet</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="text-right">Valeur</TableHead>
                <TableHead className="text-right">Payé</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Commission</TableHead>
                <TableHead>Créé le</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link
                      href={`/projects/${p.id}`}
                      className="font-semibold text-foreground underline-offset-4 hover:text-primary hover:underline"
                    >
                      {p.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.clients?.company_name ?? p.clients?.contact_name}
                  </TableCell>
                  <TableCell className="tabular text-right font-medium">
                    {formatCurrency(p.final_price)}
                  </TableCell>
                  <TableCell className="tabular text-right">
                    {formatCurrency(p.payment_amount)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={p.status} />
                  </TableCell>
                  <TableCell className="tabular text-right font-medium text-success">
                    {formatCurrency(
                      Number(p.commission_amount) + Number(p.bonus_amount),
                    )}
                  </TableCell>
                  <TableCell className="tabular text-muted-foreground">
                    {formatDate(p.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-5">
            <EmptyState
              icon={BriefcaseBusiness}
              title="Aucun projet"
              description="Cet employé n’a encore aucun projet attribué."
            />
          </div>
        )}
      </Card>
      <Card className="gap-0 py-0">
        <CardHeader className="border-b pt-4">
          <CardTitle>Historique de connexion</CardTitle>
          <CardDescription>
            Date, heure et durée des 20 dernières connexions
          </CardDescription>
        </CardHeader>
        {sessions.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Connexion</TableHead>
                <TableHead>Déconnexion</TableHead>
                <TableHead className="text-right">Durée</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>
                    <span className="tabular inline-flex items-center gap-2">
                      <Clock3
                        className="size-4 text-subtle-foreground"
                        aria-hidden="true"
                      />
                      {formatDate(session.login_at, true)}
                    </span>
                  </TableCell>
                  <TableCell className="tabular text-muted-foreground">
                    {formatDate(session.logout_at, true)}
                  </TableCell>
                  <TableCell className="tabular text-right font-medium">
                    {formatDuration(session.duration_seconds)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-5">
            <EmptyState
              icon={Clock3}
              title="Aucun historique de connexion"
              description="Les sessions apparaîtront ici après la première connexion."
            />
          </div>
        )}
      </Card>
    </div>
  );
}
