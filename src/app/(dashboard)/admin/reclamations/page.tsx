import { MessageSquareWarning } from "lucide-react";
import { updateComplaintStatus } from "@/app/(dashboard)/actions";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import type { Complaint } from "@/lib/types";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { NativeSelect } from "@/components/forms/form-fields";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Reclamations admin" };

export default async function AdminReclamationsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("complaints")
    .select("*, profiles!complaints_employee_id_fkey(first_name, last_name, email)")
    .order("created_at", { ascending: false });
  const complaints = (data ?? []) as unknown as Complaint[];
  const openCount = complaints.filter((item) => item.status === "Open").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reclamations"
        description="Demandes internes envoyees par les employes."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total"
          value={complaints.length}
          icon={MessageSquareWarning}
        />
        <StatCard
          label="Ouvertes"
          value={openCount}
          icon={MessageSquareWarning}
          tone="amber"
        />
        <StatCard
          label="Traitees"
          value={complaints.length - openCount}
          icon={MessageSquareWarning}
          tone="green"
        />
      </div>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employe</TableHead>
                  <TableHead>Objet</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {complaints.map((complaint) => (
                  <TableRow key={complaint.id}>
                    <TableCell>
                      <p className="font-medium">
                        {complaint.profiles?.first_name}{" "}
                        {complaint.profiles?.last_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {complaint.profiles?.email}
                      </p>
                    </TableCell>
                    <TableCell className="font-medium">
                      {complaint.subject}
                    </TableCell>
                    <TableCell className="max-w-sm whitespace-pre-line text-sm text-slate-600">
                      {complaint.details}
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={complaint.status} />
                    </TableCell>
                    <TableCell>{formatDate(complaint.created_at, true)}</TableCell>
                    <TableCell>
                      <form action={updateComplaintStatus} className="flex gap-2">
                        <input type="hidden" name="id" value={complaint.id} />
                        <NativeSelect
                          name="status"
                          defaultValue={complaint.status}
                          className="w-32"
                        >
                          <option value="Open">Ouverte</option>
                          <option value="Reviewed">Vue</option>
                          <option value="Closed">Fermee</option>
                        </NativeSelect>
                        <Button type="submit" size="sm" variant="outline">
                          OK
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {!complaints.length && (
            <p className="p-10 text-center text-sm text-slate-500">
              Aucune reclamation recue.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
