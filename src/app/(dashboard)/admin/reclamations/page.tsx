import { CircleCheck, Inbox, MessageSquareWarning } from "lucide-react";
import { updateComplaintStatus } from "@/app/(dashboard)/actions";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import type { Complaint } from "@/lib/types";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { EntityAvatar } from "@/components/entity-avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NativeSelect } from "@/components/forms/form-fields";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Réclamations admin" };

export default async function AdminReclamationsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("complaints")
    .select(
      "*, profiles!complaints_employee_id_fkey(first_name, last_name, email)",
    )
    .order("created_at", { ascending: false });
  const complaints = (data ?? []) as unknown as Complaint[];
  const openCount = complaints.filter((item) => item.status === "Open").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Réclamations"
        description="Demandes internes envoyées par les employés."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total" value={complaints.length} icon={Inbox} />
        <StatCard
          label="Ouvertes"
          value={openCount}
          icon={MessageSquareWarning}
          tone="amber"
        />
        <StatCard
          label="Traitées"
          value={complaints.length - openCount}
          icon={CircleCheck}
          tone="green"
        />
      </div>
      <Card className="gap-0 py-0">
        {complaints.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employé</TableHead>
                <TableHead>Réclamation</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {complaints.map((complaint) => {
                const name = `${complaint.profiles?.first_name ?? ""} ${complaint.profiles?.last_name ?? ""}`;
                return (
                  <TableRow key={complaint.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <EntityAvatar name={name} />
                        <div className="min-w-0">
                          <p className="font-semibold">
                            {complaint.profiles?.first_name}{" "}
                            {complaint.profiles?.last_name}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {complaint.profiles?.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="min-w-64 max-w-md whitespace-normal">
                      <p className="font-semibold">{complaint.subject}</p>
                      <p className="mt-1 line-clamp-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                        {complaint.details}
                      </p>
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={complaint.status} />
                    </TableCell>
                    <TableCell className="tabular text-muted-foreground">
                      {formatDate(complaint.created_at, true)}
                    </TableCell>
                    <TableCell>
                      <form
                        action={updateComplaintStatus}
                        className="flex items-center gap-2"
                      >
                        <input type="hidden" name="id" value={complaint.id} />
                        <NativeSelect
                          name="status"
                          aria-label={`Statut de la réclamation « ${complaint.subject} »`}
                          defaultValue={complaint.status}
                          className="h-8 w-32"
                        >
                          <option value="Open">Ouverte</option>
                          <option value="Reviewed">Vue</option>
                          <option value="Closed">Fermée</option>
                        </NativeSelect>
                        <Button type="submit" size="sm" variant="outline">
                          Mettre à jour
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="p-5">
            <EmptyState
              icon={Inbox}
              title="Aucune réclamation reçue"
              description="Les demandes envoyées par les employés apparaîtront ici."
            />
          </div>
        )}
      </Card>
    </div>
  );
}
