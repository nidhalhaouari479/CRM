import { frenchLabel } from "@/lib/labels";
import Link from "next/link";
import { Search, UsersRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { formatCurrency } from "@/lib/format";
import type { Client, Project } from "@/lib/types";
import { ClientFormDialog } from "@/components/forms/client-form-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
      <Card>
        <CardContent className="p-4">
          <form className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                name="q"
                defaultValue={params.q}
                className="pl-9"
                placeholder="Identifiant, nom, secteur, courriel ou téléphone"
              />
            </div>
            <NativeSelect
              name="status"
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
              Filtrer
            </Button>
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
                    <TableHead>Client</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Secteur</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Responsable</TableHead>
                    <TableHead>État</TableHead>
                    <TableHead>Projets</TableHead>
                    <TableHead>Payé</TableHead>
                    <TableHead>Impayé</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((client) => {
                    const ownProjects = projects.filter(
                      (project) => project.client_id === client.id,
                    );
                    return (
                      <TableRow key={client.id}>
                        <TableCell>
                          <Link
                            href={`/clients/${client.id}`}
                            className="font-medium text-slate-950 hover:text-blue-600"
                          >
                            {client.company_name}
                          </Link>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {client.client_code} ·{" "}
                            {frenchLabel(client.client_type)}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p>{client.contact_name || "—"}</p>
                          {client.contact_position && (
                            <p className="text-xs text-slate-500">
                              {client.contact_position}
                            </p>
                          )}
                          {client.email && (
                            <p className="text-xs text-slate-500">
                              {client.email}
                            </p>
                          )}
                          <p className="text-xs text-slate-500">
                            {client.phone}
                          </p>
                        </TableCell>
                        <TableCell>{client.business_sector || "—"}</TableCell>
                        <TableCell className="max-w-48 truncate">
                          {frenchLabel(client.service_type)}
                        </TableCell>
                        <TableCell>
                          {client.profiles
                            ? `${client.profiles.first_name} ${client.profiles.last_name}`
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <StatusBadge value={client.sales_status} />
                          <div className="mt-1">
                            <StatusBadge value={client.priority} />
                          </div>
                        </TableCell>
                        <TableCell>{ownProjects.length}</TableCell>
                        <TableCell>
                          {formatCurrency(
                            ownProjects.reduce(
                              (sum, p) => sum + Number(p.payment_amount),
                              0,
                            ),
                          )}
                        </TableCell>
                        <TableCell className="text-amber-700">
                          {formatCurrency(
                            ownProjects.reduce(
                              (sum, p) => sum + Number(p.remaining_amount),
                              0,
                            ),
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-5">
              <EmptyState
                icon={UsersRound}
                title="Aucun client"
                description="Modifiez vos filtres ou ajoutez votre premier client."
              />
            </div>
          )}
        </CardContent>
      </Card>
      {filtered.length > pageSize && (
        <div className="flex justify-end gap-2">
          <Button
            render={<Link href={`/clients?page=${page - 1}`} />}
            variant="outline"
            disabled={page <= 1}
          >
            Précédent
          </Button>
          <Button
            render={<Link href={`/clients?page=${page + 1}`} />}
            variant="outline"
            disabled={page * pageSize >= filtered.length}
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
}
