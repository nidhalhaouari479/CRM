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
import { EmptyState } from "@/components/empty-state";
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
  const totalEarned =
    Number(project.commission_amount) + Number(project.bonus_amount);
  const remaining = Number(project.remaining_amount);
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge value={project.status} />
          <StatusBadge value={project.payment_status} />
        </div>
        <form
          action={updateProjectStatus}
          aria-label="Modifier le statut du projet"
          className="flex items-center gap-2"
        >
          <input type="hidden" name="id" value={id} />
          <NativeSelect
            name="status"
            aria-label="Statut du projet"
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
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
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
          value={formatCurrency(totalEarned)}
          icon={BadgeDollarSign}
          tone="violet"
        />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Informations du projet</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-5 sm:grid-cols-2">
              <Detail label="Client">
                <Link
                  href={`/clients/${project.client_id}`}
                  className="font-semibold text-primary underline-offset-4 hover:underline"
                >
                  {project.clients?.company_name ??
                    project.clients?.contact_name}
                </Link>
              </Detail>
              <Detail label="Service">
                {frenchLabel(project.service_type)}
              </Detail>
              <Detail label="Début">
                <span className="inline-flex items-center gap-2">
                  <CalendarDays
                    aria-hidden="true"
                    className="size-4 text-subtle-foreground"
                  />
                  <span className="tabular">
                    {formatDate(project.start_date)}
                  </span>
                </span>
              </Detail>
              <Detail label="Fin prévue">
                <span className="inline-flex items-center gap-2">
                  <Clock3
                    aria-hidden="true"
                    className="size-4 text-subtle-foreground"
                  />
                  <span className="tabular">
                    {formatDate(project.expected_end_date)}
                  </span>
                </span>
              </Detail>
              <Detail label="Prix estimé">
                <span className="tabular">
                  {formatCurrency(project.estimated_price)}
                </span>
              </Detail>
              <Detail label="Prix final">
                <span className="tabular">
                  {formatCurrency(project.final_price)}
                </span>
              </Detail>
              <Detail label="Reste à payer">
                <span
                  className={remaining > 0 ? "tabular text-warning" : "tabular"}
                >
                  {formatCurrency(project.remaining_amount)}
                </span>
              </Detail>
              {project.description && (
                <div className="sm:col-span-2">
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    Description
                  </dt>
                  <dd className="mt-1 text-sm leading-6 text-foreground">
                    {project.description}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Détail de la rémunération</CardTitle>
            <CardDescription>
              Les montants sont figés lorsque le projet est entièrement payé.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
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
              <div className="flex items-baseline justify-between gap-4 border-t pt-4">
                <dt className="text-sm font-semibold text-foreground">
                  Total gagné
                </dt>
                <dd className="tabular text-2xl font-bold tracking-tight text-success">
                  {formatCurrency(totalEarned)}
                </dd>
              </div>
            </dl>
            {project.commission_locked_at && (
              <p className="mt-3 text-xs text-muted-foreground">
                Calcul figé le{" "}
                <time dateTime={project.commission_locked_at}>
                  {formatDate(project.commission_locked_at, true)}
                </time>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      <Card className="gap-0 pb-0">
        <CardHeader className="border-b">
          <CardTitle>Historique des paiements</CardTitle>
          <CardDescription>
            Chaque versement enregistré sur ce projet
          </CardDescription>
        </CardHeader>
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
                  <TableCell className="tabular">
                    <time dateTime={payment.payment_date}>
                      {formatDate(payment.payment_date)}
                    </time>
                  </TableCell>
                  <TableCell>{frenchLabel(payment.payment_method)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {payment.reference || "—"}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {payment.notes || "—"}
                  </TableCell>
                  <TableCell className="tabular text-right font-semibold text-success">
                    {formatCurrency(payment.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-5">
            <EmptyState
              icon={Banknote}
              title="Aucun paiement enregistré"
              description="Les versements ajoutés à ce projet apparaîtront ici."
            />
          </div>
        )}
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
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-foreground">{children}</dd>
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
    <div className="flex items-center justify-between gap-4 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular inline-flex items-center gap-1 font-medium">
        {Icon && (
          <Icon
            aria-hidden="true"
            className="size-3.5 text-subtle-foreground"
          />
        )}
        {value}
      </dd>
    </div>
  );
}
