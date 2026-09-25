import { frenchLabel } from "@/lib/labels";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BadgeDollarSign,
  Banknote,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  Percent,
  ReceiptText,
} from "lucide-react";
import { updateProjectStatus } from "@/app/(dashboard)/actions";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Payment, Profile, Project } from "@/lib/types";
import { PaymentFormDialog } from "@/components/forms/payment-form-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NativeSelect } from "@/components/forms/form-fields";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireProfile();
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: projectData }, { data: paymentsData }] = await Promise.all([
    supabase
      .from("projects")
      .select(
        "*, clients!projects_client_id_fkey(company_name, contact_name), profiles!projects_employee_id_fkey(first_name, last_name)",
      )
      .eq("id", id)
      .single(),
    supabase
      .from("payments")
      .select("*")
      .eq("project_id", id)
      .order("payment_date", { ascending: false }),
  ]);
  if (!projectData) notFound();
  const project = projectData as unknown as Project & {
    profiles: Pick<Profile, "first_name" | "last_name"> | null;
  };
  const payments = (paymentsData ?? []) as Payment[];
  return (
    <div className="space-y-6">
      <PageHeader
        title={project.name}
        description={`${frenchLabel(project.service_type)} · ${project.profiles ? `${project.profiles.first_name} ${project.profiles.last_name}` : ""}`}
        action={
          <PaymentFormDialog
            projectId={id}
            remaining={Number(project.remaining_amount)}
          />
        }
      />
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge value={project.status} />
        <StatusBadge value={project.payment_status} />
        <form action={updateProjectStatus} className="flex gap-2">
          <input type="hidden" name="id" value={id} />
          <NativeSelect
            name="status"
            defaultValue={project.status}
            className="w-44"
          >
            {[
              "Proposal",
              "Confirmed",
              "In Progress",
              "On Hold",
              "Completed",
              "Cancelled",
            ].map((v) => (
              <option key={v} value={v}>
                {frenchLabel(v)}
              </option>
            ))}
          </NativeSelect>
          <Button type="submit" variant="outline" size="sm">
            Mettre à jour
          </Button>
        </form>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Prix du projet"
          value={formatCurrency(project.final_price)}
          icon={ReceiptText}
        />
        <StatCard
          label="Montant encaissé"
          value={formatCurrency(project.payment_amount)}
          icon={CircleDollarSign}
          tone="green"
        />
        <StatCard
          label="Reste à payer"
          value={formatCurrency(project.remaining_amount)}
          icon={Banknote}
          tone="amber"
        />
        <StatCard
          label="Commission + bonus"
          value={formatCurrency(
            Number(project.commission_amount) + Number(project.bonus_amount),
          )}
          icon={BadgeDollarSign}
          tone="violet"
        />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informations du projet</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <Detail label="Client">
              <Link
                href={`/clients/${project.client_id}`}
                className="font-medium text-blue-600 hover:underline"
              >
                {project.clients?.company_name ?? project.clients?.contact_name}
              </Link>
            </Detail>
            <Detail label="Service">{frenchLabel(project.service_type)}</Detail>
            <Detail label="Début">
              <CalendarDays className="mr-2 inline size-4 text-slate-400" />
              {formatDate(project.start_date)}
            </Detail>
            <Detail label="Fin prévue">
              <Clock3 className="mr-2 inline size-4 text-slate-400" />
              {formatDate(project.expected_end_date)}
            </Detail>
            <Detail label="Prix estimé">
              {formatCurrency(project.estimated_price)}
            </Detail>
            <Detail label="Prix final">
              {formatCurrency(project.final_price)}
            </Detail>
            {project.description && (
              <div className="sm:col-span-2">
                <p className="text-xs text-slate-500">Description</p>
                <p className="mt-1 text-sm leading-6">{project.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Détail de la rémunération</CardTitle>
            <CardDescription>
              Les montants sont figés lorsque le projet est entièrement payé.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <EarningLine
              label="Revenu éligible"
              value={
                project.commission_locked_at
                  ? formatCurrency(project.payment_amount)
                  : "En attente du paiement complet"
              }
            />
            <EarningLine
              label="Taux appliqué"
              value={
                project.commission_rate_applied == null
                  ? "—"
                  : `${project.commission_rate_applied} %`
              }
              icon={Percent}
            />
            <EarningLine
              label="Commission"
              value={formatCurrency(project.commission_amount)}
            />
            <EarningLine
              label="Bonus"
              value={formatCurrency(project.bonus_amount)}
            />
            <div className="flex justify-between border-t pt-4 text-lg font-semibold">
              <span>Total gagné</span>
              <span className="text-emerald-700">
                {formatCurrency(
                  Number(project.commission_amount) +
                    Number(project.bonus_amount),
                )}
              </span>
            </div>
            {project.commission_locked_at && (
              <p className="text-xs text-slate-500">
                Calcul figé le {formatDate(project.commission_locked_at, true)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Historique des paiements</CardTitle>
          <CardDescription>
            Chaque versement enregistré sur ce projet
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {payments.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Méthode</TableHead>
                  <TableHead>Référence</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.payment_date)}</TableCell>
                    <TableCell>{frenchLabel(payment.payment_method)}</TableCell>
                    <TableCell>{payment.reference || "—"}</TableCell>
                    <TableCell>{payment.notes || "—"}</TableCell>
                    <TableCell className="text-right font-semibold text-emerald-700">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="p-10 text-center text-sm text-slate-500">
              Aucun paiement enregistré.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <div className="mt-1 text-sm font-medium">{children}</div>
    </div>
  );
}
function EarningLine({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof Percent;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium">
        {Icon && <Icon className="mr-1 inline size-3.5" />}
        {value}
      </span>
    </div>
  );
}
