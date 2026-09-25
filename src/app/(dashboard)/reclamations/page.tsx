import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import type { Complaint } from "@/lib/types";
import { ComplaintForm } from "@/components/forms/complaint-form";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Reclamations" };

export default async function ReclamationsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data } = await supabase
    .from("complaints")
    .select("*")
    .eq("employee_id", profile.id)
    .order("created_at", { ascending: false });
  const complaints = (data ?? []) as Complaint[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reclamations"
        description="Envoyez une demande interne a l'administration."
      />
      <div className="grid gap-5 lg:grid-cols-[.85fr_1.15fr]">
        <ComplaintForm />
        <Card>
          <CardHeader>
            <CardTitle>Mes reclamations</CardTitle>
            <CardDescription>Suivi des messages envoyes a l&apos;admin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {complaints.map((complaint) => (
              <div
                key={complaint.id}
                className="rounded-lg border p-4 text-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{complaint.subject}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDate(complaint.created_at, true)}
                    </p>
                  </div>
                  <StatusBadge value={complaint.status} />
                </div>
                <p className="mt-3 whitespace-pre-line text-slate-600">
                  {complaint.details}
                </p>
              </div>
            ))}
            {!complaints.length && (
              <p className="py-10 text-center text-sm text-slate-500">
                Aucune reclamation envoyee.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
