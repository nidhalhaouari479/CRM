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
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate, formatDuration } from "@/lib/format";
import type { Client, LoginSession, Profile, Project } from "@/lib/types";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import {
  Card,
  CardContent,
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
  return (
    <div className="space-y-6">
      <PageHeader
        title={`${employee.first_name} ${employee.last_name}`}
        description={`${employee.email} · ${employee.phone || "Téléphone non renseigné"}`}
      />
      <div className="flex gap-2">
        <StatusBadge value={employee.is_active ? "Active" : "Inactive"} />
        <StatusBadge value={employee.role} />
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
      <Card>
        <CardHeader>
          <CardTitle>Projets de l’employé</CardTitle>
          <CardDescription>Détail des valeurs et rémunérations</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Projet</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Valeur</TableHead>
                <TableHead>Payé</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Créé le</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link
                      href={`/projects/${p.id}`}
                      className="font-medium hover:text-blue-600"
                    >
                      {p.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {p.clients?.company_name ?? p.clients?.contact_name}
                  </TableCell>
                  <TableCell>{formatCurrency(p.final_price)}</TableCell>
                  <TableCell>{formatCurrency(p.payment_amount)}</TableCell>
                  <TableCell>
                    <StatusBadge value={p.status} />
                  </TableCell>
                  <TableCell>
                    {formatCurrency(
                      Number(p.commission_amount) + Number(p.bonus_amount),
                    )}
                  </TableCell>
                  <TableCell>{formatDate(p.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Historique de connexion</CardTitle>
          <CardDescription>Date, heure et duree des connexions</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Connexion</TableHead>
                <TableHead>Deconnexion</TableHead>
                <TableHead>Duree</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>
                    <Clock3 className="mr-2 inline size-4 text-slate-400" />
                    {formatDate(session.login_at, true)}
                  </TableCell>
                  <TableCell>{formatDate(session.logout_at, true)}</TableCell>
                  <TableCell className="font-medium">
                    {formatDuration(session.duration_seconds)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!sessions.length && (
            <p className="p-10 text-center text-sm text-slate-500">
              Aucun historique de connexion.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
