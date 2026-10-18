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
import { EntityAvatar } from "@/components/entity-avatar";
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
          label="Tâches ouvertes"
          value={openTasks.length}
          icon={ListChecks}
          tone="blue"
        />
        <StatCard
          label="Tâches en retard"
          value={overdueTasks.length}
          icon={CalendarClock}
          tone={overdueTasks.length ? "red" : "green"}
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
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
      <div className="grid gap-6 xl:grid-cols-[1.45fr_.75fr]">
        <Card>
          <CardHeader className="border-b">
            <div>
              <CardTitle>
                {profile.role === "admin"
                  ? "Performance des employés"
                  : "Mes projets récents"}
              </CardTitle>
              <CardDescription>
                {profile.role === "admin"
                  ? "Clients, projets et gains par collaborateur"
                  : "Vos six derniers projets"}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="-mt-4 -mb-4 p-0">
            {profile.role === "admin" ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employé</TableHead>
                    <TableHead className="text-right">Clients</TableHead>
                    <TableHead className="text-right">Projets</TableHead>
                    <TableHead className="text-right">Revenus</TableHead>
                    <TableHead className="text-right">Gains</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {performance.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Link
                          href={`/admin/employees/${row.id}`}
                          className="flex items-center gap-3 font-semibold hover:text-primary"
                        >
                          <EntityAvatar name={row.name} className="size-8" />
                          {row.name}
                        </Link>
                      </TableCell>
                      <TableCell className="tabular text-right">
                        {row.clients}
                      </TableCell>
                      <TableCell className="tabular text-right">
                        {row.projects}
                      </TableCell>
                      <TableCell className="tabular text-right">
                        {formatCurrency(row.revenue)}
                      </TableCell>
                      <TableCell className="tabular text-right font-semibold text-success">
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
                    <TableHead className="text-right">Valeur</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.slice(0, 6).map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Link
                          className="font-semibold hover:text-primary"
                          href={`/projects/${row.id}`}
                        >
                          {row.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.clients?.company_name ?? row.clients?.contact_name}
                      </TableCell>
                      <TableCell className="tabular text-right font-medium">
                        {formatCurrency(row.final_price)}
                      </TableCell>
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
          <CardHeader className="border-b">
            <CardTitle>Activités récentes</CardTitle>
            <CardDescription>Derniers échanges consignés</CardDescription>
          </CardHeader>
          <CardContent>
            {interactions.length ? (
              <ol className="relative space-y-5 before:absolute before:inset-y-2 before:left-[17px] before:w-px before:bg-border">
                {interactions.map((item) => (
                  <li key={item.id} className="relative flex gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-primary ring-4 ring-card">
                      <MessageSquareText
                        className="size-4"
                        aria-hidden="true"
                      />
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <p className="truncate text-sm font-semibold">
                        {item.objective}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {item.clients?.company_name ??
                          item.clients?.contact_name}
                      </p>
                      <p className="mt-1 text-xs text-subtle-foreground">
                        <time dateTime={item.date}>
                          {formatDate(item.date, true)}
                        </time>
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Aucune activité récente.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
