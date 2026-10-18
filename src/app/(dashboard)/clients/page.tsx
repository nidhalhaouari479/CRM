import { frenchLabel } from "@/lib/labels";
import Link from "next/link";
import { Search, SlidersHorizontal, UsersRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { formatCurrency } from "@/lib/format";
import type { Client, Project } from "@/lib/types";
import { ClientFormDialog } from "@/components/forms/client-form-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { EntityAvatar } from "@/components/entity-avatar";
import { TablePagination } from "@/components/table-pagination";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { NativeSelect } from "@/components/forms/form-fields";

export const metadata = { title: "Clients" };

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    priority?: string;
    page?: string;
  }>;
}) {
  await requireProfile();
  const params = await searchParams;
  const supabase = await createClient();
  const [{ data: clientsData }, { data: projectsData }] = await Promise.all([
    supabase
      .from("clients")
      .select("*, profiles(first_name, last_name)")
      .order("created_at", { ascending: false }),
    supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);
  const clients = (clientsData ?? []) as unknown as Client[];
  const projects = (projectsData ?? []) as Project[];
  const query = (params.q ?? "").toLowerCase();
  const filtered = clients.filter((item) => {
    const matchesQuery =
      !query ||
      `${item.client_code} ${item.company_name} ${item.contact_name ?? ""} ${item.contact_position ?? ""} ${item.business_sector ?? ""} ${item.email ?? ""} ${item.phone}`
        .toLowerCase()
        .includes(query);
    return (
      matchesQuery &&
      (!params.status || item.sales_status === params.status) &&
      (!params.priority || item.priority === params.priority)
    );
  });
  const page = Math.max(1, Number(params.page ?? 1));
  const pageSize = 10;
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description={`${filtered.length} client${filtered.length > 1 ? "s" : ""} correspondant aux filtres.`}
        action={<ClientFormDialog />}
      />
      <Card className="gap-0 py-0">
        <form
          role="search"
          aria-label="Filtrer les clients"
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
              aria-label="Rechercher un client"
              defaultValue={params.q}
              className="pl-9"
              placeholder="Identifiant, nom, secteur, courriel ou téléphone"
            />
          </div>
          <NativeSelect
            name="status"
            aria-label="Statut commercial"
            defaultValue={params.status}
            className="md:w-48"
          >
            <option value="">Tous les statuts</option>
            {[
              "New",
              "Contacted",
              "In Discussion",
              "Waiting",
              "Confirmed",
              "Lost",
              "Converted",
            ].map((v) => (
              <option key={v} value={v}>
                {frenchLabel(v)}
              </option>
            ))}
          </NativeSelect>
          <NativeSelect
            name="priority"
            aria-label="Priorité"
            defaultValue={params.priority}
            className="md:w-40"
          >
            <option value="">Toutes priorités</option>
            {["Low", "Medium", "High"].map((v) => (
              <option key={v} value={v}>
                {frenchLabel(v)}
              </option>
            ))}
          </NativeSelect>
          <Button type="submit" variant="outline">
            <SlidersHorizontal aria-hidden="true" />
            Filtrer
          </Button>
        </form>
        {rows.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Secteur</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead>État</TableHead>
                <TableHead className="text-right">Projets</TableHead>
                <TableHead className="text-right">Payé</TableHead>
                <TableHead className="text-right">Impayé</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((client) => {
                const ownProjects = projects.filter(
                  (project) => project.client_id === client.id,
                );
                const unpaid = ownProjects.reduce(
                  (sum, p) => sum + Number(p.remaining_amount),
                  0,
                );
                return (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <EntityAvatar name={client.company_name} />
                        <div className="min-w-0">
                          <Link
                            href={`/clients/${client.id}`}
                            className="font-semibold text-foreground hover:text-primary hover:underline underline-offset-4"
                          >
                            {client.company_name}
                          </Link>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {client.client_code} ·{" "}
                            {frenchLabel(client.client_type)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">
                        {client.contact_name || "—"}
                      </p>
                      {client.contact_position && (
                        <p className="text-xs text-muted-foreground">
                          {client.contact_position}
                        </p>
                      )}
                      {client.email && (
                        <p className="text-xs text-muted-foreground">
                          {client.email}
                        </p>
                      )}
                      {client.phone && (
                        <p className="tabular text-xs text-muted-foreground">
                          {client.phone}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {client.business_sector || "—"}
                    </TableCell>
                    <TableCell className="max-w-48 truncate text-muted-foreground">
                      {frenchLabel(client.service_type)}
                    </TableCell>
                    <TableCell>
                      {client.profiles
                        ? `${client.profiles.first_name} ${client.profiles.last_name}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-start gap-1">
                        <StatusBadge value={client.sales_status} />
                        <StatusBadge value={client.priority} />
                      </div>
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {ownProjects.length}
                    </TableCell>
                    <TableCell className="tabular text-right font-medium">
                      {formatCurrency(
                        ownProjects.reduce(
                          (sum, p) => sum + Number(p.payment_amount),
                          0,
                        ),
                      )}
                    </TableCell>
                    <TableCell
                      className={
                        unpaid > 0
                          ? "tabular text-right font-medium text-warning"
                          : "tabular text-right text-muted-foreground"
                      }
                    >
                      {formatCurrency(unpaid)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="p-5">
            <EmptyState
              icon={UsersRound}
              title="Aucun client"
              description="Modifiez vos filtres ou ajoutez votre premier client."
            />
          </div>
        )}
        <TablePagination
          page={page}
          pageSize={pageSize}
          total={filtered.length}
          hrefFor={(target) => `/clients?page=${target}`}
        />
      </Card>
    </div>
  );
}
