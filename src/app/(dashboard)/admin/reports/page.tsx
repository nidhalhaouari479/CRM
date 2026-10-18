import {
  BadgeDollarSign,
  CircleDollarSign,
  Contact,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/format";
import type { Client, Profile, Project } from "@/lib/types";
import { RevenueChart } from "@/components/dashboard-charts";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { EntityAvatar } from "@/components/entity-avatar";
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

interface Payment {
  amount: number;
  payment_date: string;
}
export const metadata = { title: "Rapports" };
export default async function ReportsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const [
    { data: profilesData },
    { data: clientsData },
    { data: projectsData },
    { data: paymentsData },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("role", "employee"),
    supabase.from("clients").select("*"),
    supabase.from("projects").select("*"),
    supabase
      .from("payments")
      .select("amount,payment_date")
      .order("payment_date"),
  ]);
  const profiles = (profilesData ?? []) as Profile[],
    clients = (clientsData ?? []) as Client[],
    projects = (projectsData ?? []) as Project[],
    payments = (paymentsData ?? []) as Payment[];
  const revenue = payments.reduce((s, p) => s + Number(p.amount), 0),
    pending = projects.reduce((s, p) => s + Number(p.remaining_amount), 0),
    commissions = projects.reduce(
      (s, p) => s + Number(p.commission_amount) + Number(p.bonus_amount),
      0,
    );
  const monthMap = new Map<string, number>();
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    monthMap.set(d.toLocaleDateString("fr-FR", { month: "short" }), 0);
  }
  payments.forEach((p) => {
    const k = new Date(p.payment_date).toLocaleDateString("fr-FR", {
      month: "short",
    });
    if (monthMap.has(k))
      monthMap.set(k, (monthMap.get(k) ?? 0) + Number(p.amount));
  });
  const chart = [...monthMap].map(([month, revenue]) => ({ month, revenue }));
  const rows = profiles.map((e) => {
    const own = projects.filter((p) => p.employee_id === e.id);
    return {
      name: `${e.first_name} ${e.last_name}`,
      clients: clients.filter((c) => c.created_by === e.id).length,
      projects: own.length,
      revenue: own.reduce((s, p) => s + Number(p.payment_amount), 0),
      commission: own.reduce((s, p) => s + Number(p.commission_amount), 0),
      bonus: own.reduce((s, p) => s + Number(p.bonus_amount), 0),
    };
  });
  return (
    <div className="space-y-6">
      <PageHeader
        title="Rapports"
        description="Vue consolidée des résultats commerciaux de l’entreprise."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenus encaissés"
          value={formatCurrency(revenue)}
          icon={CircleDollarSign}
          tone="green"
        />
        <StatCard
          label="Solde à encaisser"
          value={formatCurrency(pending)}
          icon={WalletCards}
          tone="amber"
        />
        <StatCard
          label="Clients convertis"
          value={clients.filter((c) => c.sales_status === "Converted").length}
          icon={Contact}
        />
        <StatCard
          label="Commissions & bonus"
          value={formatCurrency(commissions)}
          icon={BadgeDollarSign}
          tone="violet"
        />
      </div>
      <Card className="gap-0 py-0">
        <CardHeader className="border-b pt-4">
          <CardTitle>Revenus sur 12 mois</CardTitle>
          <CardDescription>
            Somme des paiements réellement enregistrés
          </CardDescription>
        </CardHeader>
        <CardContent className="py-5">
          <RevenueChart data={chart} />
        </CardContent>
      </Card>
      <Card className="gap-0 py-0">
        <CardHeader className="border-b pt-4">
          <CardTitle>Performance par employé</CardTitle>
          <CardDescription>
            Aucun classement arbitraire, uniquement les données consolidées.
          </CardDescription>
        </CardHeader>
        {rows.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employé</TableHead>
                <TableHead className="text-right">Clients</TableHead>
                <TableHead className="text-right">Projets</TableHead>
                <TableHead className="text-right">Revenus</TableHead>
                <TableHead className="text-right">Commissions</TableHead>
                <TableHead className="text-right">Bonus</TableHead>
                <TableHead className="text-right">Total gains</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.name}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <EntityAvatar name={r.name} className="size-8" />
                      <span className="font-semibold">{r.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="tabular text-right">
                    {r.clients}
                  </TableCell>
                  <TableCell className="tabular text-right">
                    {r.projects}
                  </TableCell>
                  <TableCell className="tabular text-right font-medium">
                    {formatCurrency(r.revenue)}
                  </TableCell>
                  <TableCell className="tabular text-right text-muted-foreground">
                    {formatCurrency(r.commission)}
                  </TableCell>
                  <TableCell className="tabular text-right text-muted-foreground">
                    {formatCurrency(r.bonus)}
                  </TableCell>
                  <TableCell className="tabular text-right font-semibold text-success">
                    {formatCurrency(r.commission + r.bonus)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-5">
            <EmptyState
              icon={UsersRound}
              title="Aucun employé"
              description="Les performances apparaîtront dès qu’un employé sera ajouté."
            />
          </div>
        )}
      </Card>
    </div>
  );
}
