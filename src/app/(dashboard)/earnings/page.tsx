import Link from "next/link";
import {
  BadgeDollarSign,
  CircleDollarSign,
  Percent,
  Trophy,
  Wallet,
} from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Project } from "@/lib/types";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatCard } from "@/components/stat-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Earnings {
  eligible_revenue: number;
  total_commission: number;
  total_bonuses: number;
  total_earnings: number;
  paid_projects: number;
  current_rate: number;
}
export const metadata = { title: "Mes revenus" };
export default async function EarningsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const [{ data: earningsData }, { data: projectsData }] = await Promise.all([
    supabase.rpc("get_employee_earnings", { p_employee_id: profile.id }),
    supabase
      .from("projects")
      .select("*, clients!projects_client_id_fkey(company_name, contact_name)")
      .order("commission_locked_at", { ascending: false }),
  ]);
  const earnings = (earningsData as unknown as Earnings[] | null)?.[0] ?? {
    eligible_revenue: 0,
    total_commission: 0,
    total_bonuses: 0,
    total_earnings: 0,
    paid_projects: 0,
    current_rate: 0,
  };
  const projects = (projectsData ?? []) as unknown as Project[];
  return (
    <div className="space-y-6">
      <PageHeader
        title="Mes revenus"
        description="Détail transparent des commissions et bonus définitivement acquis."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenu éligible"
          value={formatCurrency(earnings.eligible_revenue)}
          icon={CircleDollarSign}
          tone="green"
        />
        <StatCard
          label="Taux actuel"
          value={`${earnings.current_rate}%`}
          icon={Percent}
        />
        <StatCard
          label="Commissions"
          value={formatCurrency(earnings.total_commission)}
          icon={BadgeDollarSign}
          tone="violet"
        />
        <StatCard
          label="Total gagné"
          value={formatCurrency(earnings.total_earnings)}
          icon={Trophy}
          tone="amber"
        />
      </div>
      <div className="grid gap-6 lg:grid-cols-[.7fr_1.3fr]">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Répartition des gains</CardTitle>
            <CardDescription>Commission et bonus cumulés</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Commissions</span>
                <span className="tabular font-bold">
                  {formatCurrency(earnings.total_commission)}
                </span>
              </div>
              <Progress
                value={
                  earnings.total_earnings
                    ? (earnings.total_commission / earnings.total_earnings) *
                      100
                    : 0
                }
              />
            </div>
            <div>
              <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Bonus</span>
                <span className="tabular font-bold">
                  {formatCurrency(earnings.total_bonuses)}
                </span>
              </div>
              <Progress
                value={
                  earnings.total_earnings
                    ? (earnings.total_bonuses / earnings.total_earnings) * 100
                    : 0
                }
              />
            </div>
            <div className="rounded-xl bg-sidebar p-5 text-white shadow-raised">
              <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-sidebar-muted">
                <Trophy
                  className="size-4 text-sidebar-primary"
                  aria-hidden="true"
                />
                Total acquis
              </p>
              <p className="tabular mt-2 text-3xl font-bold tracking-tight">
                {formatCurrency(earnings.total_earnings)}
              </p>
              <p className="mt-3 border-t border-white/10 pt-3 text-xs text-sidebar-muted">
                Sur <span className="tabular">{earnings.paid_projects}</span>{" "}
                projet(s) entièrement payé(s)
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="gap-0 pb-0">
          <CardHeader className="border-b">
            <CardTitle>Détail par projet</CardTitle>
            <CardDescription>
              Le taux appliqué reste historique même si les règles changent.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Projet</TableHead>
                  <TableHead className="text-right">Revenu</TableHead>
                  <TableHead className="text-right">Taux</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                  <TableHead className="text-right">Bonus</TableHead>
                  <TableHead>Acquis le</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects
                  .filter((p) => p.commission_locked_at)
                  .map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Link
                          href={`/projects/${p.id}`}
                          className="font-semibold hover:text-primary"
                        >
                          {p.name}
                        </Link>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {p.clients?.company_name ?? p.clients?.contact_name}
                        </p>
                      </TableCell>
                      <TableCell className="tabular text-right">
                        {formatCurrency(p.payment_amount)}
                      </TableCell>
                      <TableCell className="tabular text-right text-muted-foreground">
                        {p.commission_rate_applied}%
                      </TableCell>
                      <TableCell className="tabular text-right font-semibold text-success">
                        {formatCurrency(p.commission_amount)}
                      </TableCell>
                      <TableCell className="tabular text-right">
                        {formatCurrency(p.bonus_amount)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <time dateTime={p.commission_locked_at ?? undefined}>
                          {formatDate(p.commission_locked_at)}
                        </time>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            {!projects.some((p) => p.commission_locked_at) && (
              <div className="p-5">
                <EmptyState
                  icon={Wallet}
                  title="Aucun gain acquis"
                  description="Aucun projet entièrement payé pour le moment."
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
