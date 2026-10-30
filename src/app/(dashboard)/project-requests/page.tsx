import Link from "next/link";
import { CheckCircle2, Inbox, Mail, Phone, Sparkles } from "lucide-react";
import { updateProjectRequestStatus } from "@/app/(dashboard)/actions";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { frenchLabel } from "@/lib/labels";
import { PROJECT_REQUEST_STATUSES, type ProjectRequest } from "@/lib/types";
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

export const metadata = { title: "Demandes web" };

export default async function ProjectRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireProfile();
  const { status } = await searchParams;
  const activeStatus = PROJECT_REQUEST_STATUSES.find((item) => item === status);
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_requests")
    .select("*, profiles(first_name, last_name)")
    .order("created_at", { ascending: false });
  const requests = (data ?? []) as unknown as ProjectRequest[];
  const visible = activeStatus
    ? requests.filter((item) => item.status === activeStatus)
    : requests;
  const count = (value: ProjectRequest["status"]) =>
    requests.filter((item) => item.status === value).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Demandes web"
        description="Demandes de projet envoyees depuis le formulaire du site web."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total" value={requests.length} icon={Inbox} />
        <StatCard
          label="Nouvelles"
          value={count("New")}
          icon={Sparkles}
          tone="amber"
        />
        <StatCard
          label="Converties"
          value={count("Converted")}
          icon={CheckCircle2}
          tone="green"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          render={<Link href="/project-requests" />}
          nativeButton={false}
          variant={activeStatus ? "outline" : "default"}
          size="sm"
        >
          Toutes
        </Button>
        {PROJECT_REQUEST_STATUSES.map((item) => (
          <Button
            key={item}
            render={<Link href={`/project-requests?status=${item}`} />}
            nativeButton={false}
            variant={activeStatus === item ? "default" : "outline"}
            size="sm"
          >
            {frenchLabel(item)} ({count(item)})
          </Button>
        ))}
      </div>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Projet</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Recue le</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((request) => (
                  <TableRow key={request.id} className="align-top">
                    <TableCell>
                      <p className="font-medium">{request.name}</p>
                      {request.company && (
                        <p className="text-xs text-muted-foreground">
                          {request.company}
                        </p>
                      )}
                      <a
                        href={`mailto:${request.email}`}
                        className="mt-1 flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <Mail className="size-3" /> {request.email}
                      </a>
                      {request.phone && (
                        <a
                          href={`tel:${request.phone.replace(/\s/g, "")}`}
                          className="flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <Phone className="size-3" /> {request.phone}
                        </a>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      <p className="font-medium">{request.project_type}</p>
                      <p className="text-xs text-muted-foreground">
                        Delai : {request.timeline ?? "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Budget : {request.budget ?? "—"}
                      </p>
                    </TableCell>
                    <TableCell className="max-w-sm whitespace-pre-line text-sm text-muted-foreground">
                      {request.message}
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={request.status} />
                      {request.profiles && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          par {request.profiles.first_name}{" "}
                          {request.profiles.last_name}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(request.created_at, true)}</TableCell>
                    <TableCell>
                      <form
                        action={updateProjectRequestStatus}
                        className="flex gap-2"
                      >
                        <input type="hidden" name="id" value={request.id} />
                        <NativeSelect
                          name="status"
                          defaultValue={request.status}
                          className="w-32"
                        >
                          {PROJECT_REQUEST_STATUSES.map((item) => (
                            <option key={item} value={item}>
                              {frenchLabel(item)}
                            </option>
                          ))}
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
          {!visible.length && (
            <p className="p-10 text-center text-sm text-muted-foreground">
              Aucune demande recue.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
