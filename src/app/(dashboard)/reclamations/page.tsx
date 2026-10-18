import { MessageSquareWarning } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import type { Complaint } from "@/lib/types";
import { ComplaintForm } from "@/components/forms/complaint-form";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Réclamations" };

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
        title="Réclamations"
        description="Envoyez une demande interne à l’administration."
      />
      <div className="grid items-start gap-6 lg:grid-cols-[.85fr_1.15fr]">
        <ComplaintForm />
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Mes réclamations</CardTitle>
            <CardDescription>
              Suivi des messages envoyés à l’administration
            </CardDescription>
          </CardHeader>
          <CardContent>
            {complaints.length ? (
              <ul className="space-y-3">
                {complaints.map((complaint) => (
                  <li
                    key={complaint.id}
                    className="rounded-xl border bg-card p-4 text-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold">{complaint.subject}</p>
                        <p className="mt-0.5 text-xs text-subtle-foreground">
                          <time dateTime={complaint.created_at}>
                            {formatDate(complaint.created_at, true)}
                          </time>
                        </p>
                      </div>
                      <StatusBadge value={complaint.status} />
                    </div>
                    <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">
                      {complaint.details}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={MessageSquareWarning}
                title="Aucune réclamation"
                description="Aucune réclamation envoyée pour le moment."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
