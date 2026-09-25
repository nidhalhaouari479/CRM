import Link from "next/link";
import {
  BadgeDollarSign,
  CircleDollarSign,
  Percent,
  Trophy,
} from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Project } from "@/lib/types";
import { PageHeader } from "@/components/layout/page-header";
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
      <div className="grid gap-5 lg:grid-cols-[.7fr_1.3fr]">
        <Card>
          <CardHeader>
            <CardTitle>Répartition des gains</CardTitle>
            <CardDescription>Commission et bonus cumulés</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span>Commissions</span>
                <strong>{formatCurrency(earnings.total_commission)}</strong>
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
              <div className="mb-2 flex justify-between text-sm">
                <span>Bonus</span>
                <strong>{formatCurrency(earnings.total_bonuses)}</strong>
              </div>
              <Progress
                value={
                  earnings.total_earnings
                    ? (earnings.total_bonuses / earnings.total_earnings) * 100
                    : 0
                }
              />
            </div>
            <div className="rounded-xl bg-slate-950 p-5 text-white">
              <p className="text-sm text-slate-400">Total acquis</p>
              <p className="mt-1 text-3xl font-semibold">
                {formatCurrency(earnings.total_earnings)}
              </p>
              <p className="mt-3 text-xs text-slate-400">
                Sur {earnings.paid_projects} projet(s) entièrement payé(s)
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
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
                  <TableHead>Revenu</TableHead>
                  <TableHead>Taux</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Bonus</TableHead>
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
                          className="font-medium hover:text-blue-600"
                        >
                          {p.name}
                        </Link>
                        <p className="text-xs text-slate-500">
                          {p.clients?.company_name ?? p.clients?.contact_name}
                        </p>
                      </TableCell>
                      <TableCell>{formatCurrency(p.payment_amount)}</TableCell>
                      <TableCell>{p.commission_rate_applied}%</TableCell>
                      <TableCell>
                        {formatCurrency(p.commission_amount)}
                      </TableCell>
                      <TableCell>{formatCurrency(p.bonus_amount)}</TableCell>
                      <TableCell>
                        {formatDate(p.commission_locked_at)}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            {!projects.some((p) => p.commission_locked_at) && (
              <p className="p-10 text-center text-sm text-slate-500">
                Aucun projet entièrement payé pour le moment.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
