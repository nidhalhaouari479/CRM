import { frenchLabel } from "@/lib/labels";
import Link from "next/link";
import { BriefcaseBusiness, Search } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Project } from "@/lib/types";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
      <Card>
        <CardContent className="p-4">
          <form className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                name="q"
                defaultValue={params.q}
                className="pl-9"
                placeholder="Projet ou client"
              />
            </div>
            <NativeSelect
              name="status"
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
            <Button variant="outline">Filtrer</Button>
          </form>
        </CardContent>
      </Card>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {rows.length ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Projet</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Employé</TableHead>
                    <TableHead>Prix final</TableHead>
                    <TableHead>Payé</TableHead>
                    <TableHead>Reste</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Paiement</TableHead>
                    <TableHead>Créé le</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Link
                          href={`/projects/${item.id}`}
                          className="font-medium hover:text-blue-600"
                        >
                          {item.name}
                        </Link>
                        <p className="text-xs text-slate-500">
                          {frenchLabel(item.service_type)}
                        </p>
                      </TableCell>
                      <TableCell>
                        {item.clients?.company_name ??
                          item.clients?.contact_name}
                      </TableCell>
                      <TableCell>
                        {item.profiles
                          ? `${item.profiles.first_name} ${item.profiles.last_name}`
                          : "—"}
                      </TableCell>
                      <TableCell>{formatCurrency(item.final_price)}</TableCell>
                      <TableCell className="text-emerald-700">
                        {formatCurrency(item.payment_amount)}
                      </TableCell>
                      <TableCell className="text-amber-700">
                        {formatCurrency(item.remaining_amount)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge value={item.status} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge value={item.payment_status} />
                      </TableCell>
                      <TableCell>{formatDate(item.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-5">
              <EmptyState
                icon={BriefcaseBusiness}
                title="Aucun projet"
                description="Créez un projet depuis la fiche d’un client."
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
