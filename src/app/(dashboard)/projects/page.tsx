import { frenchLabel } from "@/lib/labels";
import Link from "next/link";
import { BriefcaseBusiness, Search, SlidersHorizontal } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Project } from "@/lib/types";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { EntityAvatar } from "@/components/entity-avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/forms/form-fields";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Projets" };

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; payment?: string }>;
}) {
  await requireProfile();
  const params = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select(
      "*, clients!projects_client_id_fkey(company_name, contact_name), profiles!projects_employee_id_fkey(first_name, last_name)",
    )
    .order("created_at", { ascending: false });
  const projects = (data ?? []) as unknown as Project[];
  const q = (params.q ?? "").toLowerCase();
  const rows = projects.filter(
    (item) =>
      (!q ||
        `${item.name} ${item.clients?.company_name ?? ""} ${item.clients?.contact_name ?? ""}`
          .toLowerCase()
          .includes(q)) &&
      (!params.status || item.status === params.status) &&
      (!params.payment || item.payment_status === params.payment),
  );
  return (
    <div className="space-y-6">
      <PageHeader
        title="Projets"
        description={`${rows.length} projet(s) dans votre périmètre.`}
      />
      <Card className="gap-0 py-0">
        <form
          role="search"
          aria-label="Filtrer les projets"
          className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center"
        >
          <div className="relative flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle-foreground"
            />
            <Input
              name="q"
              type="search"
              aria-label="Rechercher un projet"
              defaultValue={params.q}
              className="pl-9"
              placeholder="Projet ou client"
            />
          </div>
          <NativeSelect
            name="status"
            aria-label="Statut du projet"
            defaultValue={params.status}
            className="md:w-48"
          >
            <option value="">Tous les statuts</option>
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
          <NativeSelect
            name="payment"
            aria-label="Statut de paiement"
            defaultValue={params.payment}
            className="md:w-48"
          >
            <option value="">Tous les paiements</option>
            {["Not Paid", "Partially Paid", "Paid", "Refunded"].map((v) => (
              <option key={v} value={v}>
                {frenchLabel(v)}
              </option>
            ))}
          </NativeSelect>
          <Button variant="outline">
            <SlidersHorizontal aria-hidden="true" />
            Filtrer
          </Button>
        </form>
        {rows.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Projet</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Employé</TableHead>
                <TableHead className="text-right">Prix final</TableHead>
                <TableHead className="text-right">Payé</TableHead>
                <TableHead className="text-right">Reste</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Paiement</TableHead>
                <TableHead>Créé le</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((item) => {
                const remaining = Number(item.remaining_amount);
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <EntityAvatar name={item.name} />
                        <div className="min-w-0">
                          <Link
                            href={`/projects/${item.id}`}
                            className="font-semibold text-foreground hover:text-primary hover:underline underline-offset-4"
                          >
                            {item.name}
                          </Link>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {frenchLabel(item.service_type)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.clients?.company_name ?? item.clients?.contact_name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.profiles
                        ? `${item.profiles.first_name} ${item.profiles.last_name}`
                        : "—"}
                    </TableCell>
                    <TableCell className="tabular text-right font-medium">
                      {formatCurrency(item.final_price)}
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {formatCurrency(item.payment_amount)}
                    </TableCell>
                    <TableCell
                      className={
                        remaining > 0
                          ? "tabular text-right font-medium text-warning"
                          : "tabular text-right text-muted-foreground"
                      }
                    >
                      {formatCurrency(item.remaining_amount)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={item.status} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={item.payment_status} />
                    </TableCell>
                    <TableCell className="tabular text-muted-foreground">
                      <time dateTime={item.created_at}>
                        {formatDate(item.created_at)}
                      </time>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="p-5">
            <EmptyState
              icon={BriefcaseBusiness}
              title="Aucun projet"
              description="Créez un projet depuis la fiche d’un client."
            />
          </div>
        )}
      </Card>
    </div>
  );
}
