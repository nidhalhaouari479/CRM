import { frenchLabel } from "@/lib/labels";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Client, Profile, Project } from "@/lib/types";
import { toggleEmployee } from "@/app/(dashboard)/actions";
import { EmployeeFormDialog } from "@/components/forms/employee-form-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Clients</TableHead>
                  <TableHead>Projets</TableHead>
                  <TableHead>Revenu</TableHead>
                  <TableHead>Gains</TableHead>
                  <TableHead>Arrivée</TableHead>
                  <TableHead></TableHead>
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
                        <Link
                          href={`/admin/employees/${employee.id}`}
                          className="font-medium hover:text-blue-600"
                        >
                          {employee.first_name} {employee.last_name}
                        </Link>
                        <p className="text-xs text-slate-500">
                          {employee.email}
                        </p>
                      </TableCell>
                      <TableCell className="capitalize">
                        {frenchLabel(employee.role)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          value={employee.is_active ? "Active" : "Inactive"}
                        />
                      </TableCell>
                      <TableCell>
                        {
                          clients.filter((c) => c.created_by === employee.id)
                            .length
                        }
                      </TableCell>
                      <TableCell>{own.length}</TableCell>
                      <TableCell>
                        {formatCurrency(
                          own.reduce((s, p) => s + Number(p.payment_amount), 0),
                        )}
                      </TableCell>
                      <TableCell>
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
                      <TableCell>{formatDate(employee.created_at)}</TableCell>
                      <TableCell>
                        {employee.role !== "admin" && (
                          <form action={toggleEmployee}>
                            <input
                              type="hidden"
                              name="id"
                              value={employee.id}
                            />
                            <input
                              type="hidden"
                              name="is_active"
                              value={String(employee.is_active)}
                            />
                            <Button size="sm" variant="outline">
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
