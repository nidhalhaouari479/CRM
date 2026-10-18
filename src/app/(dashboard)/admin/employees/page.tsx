import { frenchLabel } from "@/lib/labels";
import Link from "next/link";
import { UsersRound } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Client, Profile, Project } from "@/lib/types";
import { toggleEmployee } from "@/app/(dashboard)/actions";
import { EmployeeFormDialog } from "@/components/forms/employee-form-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { EntityAvatar } from "@/components/entity-avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Employés" };
export default async function EmployeesPage() {
  await requireAdmin();
  const supabase = await createClient();
  const [
    { data: profilesData },
    { data: clientsData },
    { data: projectsData },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("clients").select("id, created_by"),
    supabase.from("projects").select("*"),
  ]);
  const profiles = (profilesData ?? []) as Profile[];
  const clients = (clientsData ?? []) as Pick<Client, "id" | "created_by">[];
  const projects = (projectsData ?? []) as Project[];
  return (
    <div className="space-y-6">
      <PageHeader
        title="Employés"
        description="Comptes, activité et performance commerciale."
        action={<EmployeeFormDialog />}
      />
      <Card className="gap-0 py-0">
        {profiles.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employé</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Clients</TableHead>
                <TableHead className="text-right">Projets</TableHead>
                <TableHead className="text-right">Revenu</TableHead>
                <TableHead className="text-right">Gains</TableHead>
                <TableHead>Arrivée</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((employee) => {
                const own = projects.filter(
                  (p) => p.employee_id === employee.id,
                );
                return (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <EntityAvatar
                          name={`${employee.first_name} ${employee.last_name}`}
                        />
                        <div className="min-w-0">
                          <Link
                            href={`/admin/employees/${employee.id}`}
                            className="font-semibold text-foreground underline-offset-4 hover:text-primary hover:underline"
                          >
                            {employee.first_name} {employee.last_name}
                          </Link>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {employee.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize text-muted-foreground">
                      {frenchLabel(employee.role)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        value={employee.is_active ? "Active" : "Inactive"}
                      />
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {
                        clients.filter((c) => c.created_by === employee.id)
                          .length
                      }
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {own.length}
                    </TableCell>
                    <TableCell className="tabular text-right font-medium">
                      {formatCurrency(
                        own.reduce((s, p) => s + Number(p.payment_amount), 0),
                      )}
                    </TableCell>
                    <TableCell className="tabular text-right font-medium text-success">
                      {formatCurrency(
                        own.reduce(
                          (s, p) =>
                            s +
                            Number(p.commission_amount) +
                            Number(p.bonus_amount),
                          0,
                        ),
                      )}
                    </TableCell>
                    <TableCell className="tabular text-muted-foreground">
                      {formatDate(employee.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      {employee.role !== "admin" && (
                        <form action={toggleEmployee}>
                          <input type="hidden" name="id" value={employee.id} />
                          <input
                            type="hidden"
                            name="is_active"
                            value={String(employee.is_active)}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className={
                              employee.is_active
                                ? "hover:bg-destructive-muted hover:text-destructive"
                                : undefined
                            }
                          >
                            {employee.is_active ? "Désactiver" : "Activer"}
                          </Button>
                        </form>
                      )}
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
              title="Aucun employé"
              description="Créez un premier compte employé pour commencer."
            />
          </div>
        )}
      </Card>
    </div>
  );
}
