import Link from "next/link";
import { CalendarClock, CheckCircle2, ListChecks, Search } from "lucide-react";
import { updateTaskStatus } from "@/app/(dashboard)/actions";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { frenchLabel } from "@/lib/labels";
import { formatDate } from "@/lib/format";
import type { Client, Profile, Project, Task } from "@/lib/types";
import { EmptyState } from "@/components/empty-state";
import { TaskForm } from "@/components/forms/task-form";
import { NativeSelect } from "@/components/forms/form-fields";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
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

export const metadata = { title: "Taches" };

const statuses = ["Todo", "In Progress", "Blocked", "Done"];

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; assigned?: string }>;
}) {
  const profile = await requireProfile();
  const params = await searchParams;
  const supabase = await createClient();
  const [
    { data: tasksData },
    { data: employeesData },
    { data: clientsData },
    { data: projectsData },
  ] = await Promise.all([
    supabase
      .from("tasks")
      .select(
        "*, clients(company_name, contact_name), projects(name), assignee:profiles!tasks_assigned_to_fkey(first_name, last_name, email), creator:profiles!tasks_created_by_fkey(first_name, last_name, email)",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, first_name, last_name, email")
      .eq("is_active", true)
      .order("first_name"),
    supabase
      .from("clients")
      .select("id, company_name, contact_name")
      .order("created_at", { ascending: false }),
    supabase
      .from("projects")
      .select("id, name")
      .order("created_at", { ascending: false }),
  ]);

  const tasks = (tasksData ?? []) as unknown as Task[];
  const employees = (employeesData ?? []) as Pick<
    Profile,
    "id" | "first_name" | "last_name" | "email"
  >[];
  const clients = (clientsData ?? []) as Pick<
    Client,
    "id" | "company_name" | "contact_name"
  >[];
  const projects = (projectsData ?? []) as Pick<Project, "id" | "name">[];
  const q = (params.q ?? "").toLowerCase();
  const rows = tasks.filter((task) => {
    const haystack = [
      task.title,
      task.description ?? "",
      task.clients?.company_name ?? "",
      task.clients?.contact_name ?? "",
      task.projects?.name ?? "",
      task.assignee
        ? `${task.assignee.first_name} ${task.assignee.last_name}`
        : "",
    ]
      .join(" ")
      .toLowerCase();
    return (
      (!q || haystack.includes(q)) &&
      (!params.status || task.status === params.status) &&
      (!params.assigned || task.assigned_to === params.assigned)
    );
  });
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const openTasks = tasks.filter((task) => task.status !== "Done");
  const overdueTasks = openTasks.filter(
    (task) => task.due_date && new Date(task.due_date) < today,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Taches"
        description={`${rows.length} tache(s) dans votre perimetre.`}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Ouvertes" value={openTasks.length} icon={ListChecks} />
        <StatCard
          label="En retard"
          value={overdueTasks.length}
          icon={CalendarClock}
          tone={overdueTasks.length ? "red" : "green"}
        />
        <StatCard
          label="Terminees"
          value={tasks.filter((task) => task.status === "Done").length}
          icon={CheckCircle2}
          tone="green"
        />
      </div>
      <TaskForm
        employees={employees}
        clients={clients}
        projects={projects}
        currentProfileId={profile.id}
        isAdmin={profile.role === "admin"}
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
                placeholder="Titre, client, projet ou employe"
              />
            </div>
            <NativeSelect
              name="status"
              defaultValue={params.status}
              className="md:w-48"
            >
              <option value="">Tous les statuts</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {frenchLabel(status)}
                </option>
              ))}
            </NativeSelect>
            {profile.role === "admin" && (
              <NativeSelect
                name="assigned"
                defaultValue={params.assigned}
                className="md:w-56"
              >
                <option value="">Tous les employes</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.first_name} {employee.last_name}
                  </option>
                ))}
              </NativeSelect>
            )}
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
                    <TableHead>Tache</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Lien</TableHead>
                    <TableHead>Priorite</TableHead>
                    <TableHead>Echeance</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="min-w-64">
                        <p className="font-medium">{task.title}</p>
                        {task.description && (
                          <p className="mt-1 line-clamp-2 max-w-md text-xs text-slate-500">
                            {task.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">
                          {task.assignee?.first_name} {task.assignee?.last_name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {task.assignee?.email}
                        </p>
                      </TableCell>
                      <TableCell>
                        {task.project_id && task.projects ? (
                          <Link
                            href={`/projects/${task.project_id}`}
                            className="font-medium hover:text-blue-600"
                          >
                            {task.projects.name}
                          </Link>
                        ) : (
                          task.clients?.company_name ??
                          task.clients?.contact_name ??
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge value={task.priority} />
                      </TableCell>
                      <TableCell>{formatDate(task.due_date)}</TableCell>
                      <TableCell>
                        <StatusBadge value={task.status} />
                      </TableCell>
                      <TableCell>
                        <form action={updateTaskStatus} className="flex gap-2">
                          <input type="hidden" name="id" value={task.id} />
                          <NativeSelect
                            name="status"
                            defaultValue={task.status}
                            className="w-36"
                          >
                            {statuses.map((status) => (
                              <option key={status} value={status}>
                                {frenchLabel(status)}
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
          ) : (
            <div className="p-5">
              <EmptyState
                icon={ListChecks}
                title="Aucune tache"
                description="Creez une tache pour suivre les prochaines actions."
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
