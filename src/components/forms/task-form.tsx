"use client";

import { useActionState } from "react";
import { ListChecks, Plus } from "lucide-react";
import { createTask } from "@/app/(dashboard)/actions";
import type { Client, Profile, Project } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormGrid, NativeSelect } from "@/components/forms/form-fields";

export function TaskForm({
  employees,
  clients,
  projects,
  currentProfileId,
  isAdmin,
}: {
  employees: Pick<Profile, "id" | "first_name" | "last_name" | "email">[];
  clients: Pick<Client, "id" | "company_name" | "contact_name">[];
  projects: Pick<Project, "id" | "name">[];
  currentProfileId: string;
  isAdmin: boolean;
}) {
  const [state, formAction, pending] = useActionState(createTask, {
    error: "",
    success: false,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListChecks className="size-5 text-blue-600" />
          Nouvelle tache
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-5">
          <Field label="Titre" htmlFor="title" required>
            <Input id="title" name="title" required />
          </Field>
          <Field label="Description" htmlFor="description">
            <Textarea id="description" name="description" rows={4} />
          </Field>
          <FormGrid>
            <Field label="Statut" htmlFor="status">
              <NativeSelect id="status" name="status" defaultValue="Todo">
                <option value="Todo">A faire</option>
                <option value="In Progress">En cours</option>
                <option value="Blocked">Bloquee</option>
                <option value="Done">Terminee</option>
              </NativeSelect>
            </Field>
            <Field label="Priorite" htmlFor="priority">
              <NativeSelect id="priority" name="priority" defaultValue="Medium">
                <option value="Low">Faible</option>
                <option value="Medium">Moyenne</option>
                <option value="High">Elevee</option>
              </NativeSelect>
            </Field>
            <Field label="Echeance" htmlFor="due_date">
              <Input id="due_date" name="due_date" type="date" />
            </Field>
            {isAdmin ? (
              <Field label="Assignee" htmlFor="assigned_to">
                <NativeSelect
                  id="assigned_to"
                  name="assigned_to"
                  defaultValue={currentProfileId}
                >
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.first_name} {employee.last_name}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            ) : (
              <input type="hidden" name="assigned_to" value={currentProfileId} />
            )}
            <Field label="Client lie" htmlFor="client_id">
              <NativeSelect id="client_id" name="client_id" defaultValue="">
                <option value="">Aucun client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.company_name || client.contact_name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Projet lie" htmlFor="project_id">
              <NativeSelect id="project_id" name="project_id" defaultValue="">
                <option value="">Aucun projet</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </FormGrid>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={pending}>
              <Plus />
              {pending ? "Creation..." : "Creer la tache"}
            </Button>
            {state.success && (
              <p className="text-sm text-emerald-700">Tache creee.</p>
            )}
            {state.error && (
              <p role="alert" className="text-sm text-red-600">
                {state.error}
              </p>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
