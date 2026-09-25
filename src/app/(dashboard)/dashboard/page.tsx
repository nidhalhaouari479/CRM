import Link from "next/link";
import {
  Banknote,
  BriefcaseBusiness,
  CalendarClock,
  CircleDollarSign,
  Contact,
  ListChecks,
  MessageSquareText,
  TrendingUp,
  Users,
} from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Client, Interaction, Profile, Project, Task } from "@/lib/types";
import { ClientFormDialog } from "@/components/forms/client-form-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { RevenueChart, PipelineChart } from "@/components/dashboard-charts";
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

export const metadata = { title: "Tableau de bord" };

interface PaymentRow {
  amount: number;
  payment_date: string;
}

export default async function DashboardPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const [
    { data: clientsData },
    { data: projectsData },
    { data: paymentsData },
    { data: interactionsData },
    { data: profilesData },
    { data: tasksData },
  ] = await Promise.all([
    supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("projects")
      .select(
        "*, clients!projects_client_id_fkey(company_name, contact_name), profiles!projects_employee_id_fkey(first_name, last_name)",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("payments")
      .select("amount, payment_date")
      .order("payment_date"),
    supabase
      .from("interactions")
      .select(
        "*, clients(company_name, contact_name), profiles(first_name, last_name)",
      )
      .order("date", { ascending: false })
      .limit(6),
    supabase.from("profiles").select("*").eq("is_active", true),
    supabase.from("tasks").select("*"),
  ]);

  const clients = (clientsData ?? []) as Client[];
  const projects = (projectsData ?? []) as unknown as Project[];
  const payments = (paymentsData ?? []) as PaymentRow[];
  const interactions = (interactionsData ?? []) as unknown as Interaction[];
  const profiles = (profilesData ?? []) as Profile[];
  const tasks = (tasksData ?? []) as Task[];
  const paidRevenue = payments.reduce(
    (sum, item) => sum + Number(item.amount),
    0,
  );
  const pending = projects.reduce(
    (sum, item) => sum + Number(item.remaining_amount),
    0,
  );
  const activeProjects = projects.filter((item) =>
    ["Confirmed", "In Progress", "On Hold"].includes(item.status),
  ).length;
  const commissionTotal = projects.reduce(
    (sum, item) =>
      sum + Number(item.commission_amount) + Number(item.bonus_amount),
    0,
  );
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const openTasks = tasks.filter((item) => item.status !== "Done");
  const overdueTasks = openTasks.filter(
    (item) => item.due_date && new Date(item.due_date) < today,
  );

  const monthMap = new Map<string, number>();
  for (let offset = 5; offset >= 0; offset--) {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - offset);
    monthMap.set(date.toLocaleDateString("fr-FR", { month: "short" }), 0);
  }
  payments.forEach((payment) => {
    const key = new Date(payment.payment_date).toLocaleDateString("fr-FR", {
      month: "short",
    });
    if (monthMap.has(key))
      monthMap.set(key, (monthMap.get(key) ?? 0) + Number(payment.amount));
  });
  const revenueChart = [...monthMap].map(([month, revenue]) => ({
    month,
    revenue,
  }));
  const pipelineStatuses = [
    "New",
    "Contacted",
    "In Discussion",
    "Waiting",
    "Confirmed",
    "Converted",
  ];
  const pipeline = pipelineStatuses.map((status) => ({
    status,
    count: clients.filter((item) => item.sales_status === status).length,
  }));

  const performance = profiles.map((employee) => {
    const ownProjects = projects.filter(
      (item) => item.employee_id === employee.id,
    );
    return {
      id: employee.id,
      name: `${employee.first_name} ${employee.last_name}`,
      clients: clients.filter((item) => item.created_by === employee.id).length,
      projects: ownProjects.length,
      revenue: ownProjects.reduce(
        (sum, item) => sum + Number(item.payment_amount),
        0,
      ),
      earnings: ownProjects.reduce(
        (sum, item) =>
          sum + Number(item.commission_amount) + Number(item.bonus_amount),
        0,
      ),
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tableau de bord"
        description={`Bienvenue ${profile.first_name || ""}, voici l’activité commerciale en temps réel.`}
        action={<ClientFormDialog />}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {profile.role === "admin" && (
          <StatCard
            label="Employés actifs"
            value={profiles.filter((item) => item.role === "employee").length}
            icon={Users}
          />
        )}
        <StatCard
          label="Clients"
          value={clients.length}
          icon={Contact}
          tone="violet"
        />
        <StatCard
          label="Projets en cours"
          value={activeProjects}
          icon={BriefcaseBusiness}
          tone="blue"
        />
        <StatCard
          label="Revenus encaissés"
          value={formatCurrency(paidRevenue)}
          icon={CircleDollarSign}
          tone="green"
        />
        {profile.role !== "admin" && (
          <StatCard
            label="Mes gains"
            value={formatCurrency(commissionTotal)}
            icon={TrendingUp}
            tone="green"
          />
        )}
        <StatCard
          label="Paiements en attente"
          value={formatCurrency(pending)}
          icon={Banknote}
          tone="amber"
        />
        <StatCard
          label="Taches ouvertes"
          value={openTasks.length}
          icon={ListChecks}
          tone="blue"
        />
        <StatCard
          label="Taches en retard"
          value={overdueTasks.length}
          icon={CalendarClock}
          tone={overdueTasks.length ? "red" : "green"}
        />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Évolution des revenus</CardTitle>
            <CardDescription>
              Encaissements des six derniers mois
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart data={revenueChart} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Progression des clients</CardTitle>
            <CardDescription>Répartition par étape commerciale</CardDescription>
          </CardHeader>
          <CardContent>
            <PipelineChart data={pipeline} />
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.45fr_.75fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>
                {profile.role === "admin"
                  ? "Performance des employés"
                  : "Mes projets récents"}
              </CardTitle>
              <CardDescription>
                Données factuelles calculées depuis Supabase
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            {profile.role === "admin" ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employé</TableHead>
                    <TableHead>Clients</TableHead>
                    <TableHead>Projets</TableHead>
                    <TableHead>Revenus</TableHead>
                    <TableHead>Gains</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {performance.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/admin/employees/${row.id}`}
                          className="hover:text-blue-600"
                        >
                          {row.name}
                        </Link>
                      </TableCell>
                      <TableCell>{row.clients}</TableCell>
                      <TableCell>{row.projects}</TableCell>
                      <TableCell>{formatCurrency(row.revenue)}</TableCell>
                      <TableCell className="font-medium text-emerald-700">
                        {formatCurrency(row.earnings)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Projet</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Valeur</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.slice(0, 6).map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Link
                          className="font-medium hover:text-blue-600"
                          href={`/projects/${row.id}`}
                        >
                          {row.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {row.clients?.company_name ?? row.clients?.contact_name}
                      </TableCell>
                      <TableCell>{formatCurrency(row.final_price)}</TableCell>
                      <TableCell>
                        <StatusBadge value={row.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Activités récentes</CardTitle>
            <CardDescription>Derniers échanges consignés</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {interactions.length ? (
              interactions.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-600">
                    <MessageSquareText className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {item.objective}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {item.clients?.company_name ?? item.clients?.contact_name}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {formatDate(item.date, true)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-10 text-center text-sm text-slate-500">
                Aucune activité récente.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
