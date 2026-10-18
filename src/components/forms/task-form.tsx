"use client";

import { useActionState } from "react";
import { AlertTriangle, CheckCircle2, ListChecks, Plus } from "lucide-react";
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
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <ListChecks className="size-5 text-primary" aria-hidden="true" />
          Nouvelle tâche
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
                <option value="Todo">À faire</option>
                <option value="In Progress">En cours</option>
                <option value="Blocked">Bloquée</option>
                <option value="Done">Terminée</option>
              </NativeSelect>
            </Field>
            <Field label="Priorité" htmlFor="priority">
              <NativeSelect id="priority" name="priority" defaultValue="Medium">
                <option value="Low">Faible</option>
                <option value="Medium">Moyenne</option>
                <option value="High">Élevée</option>
              </NativeSelect>
            </Field>
            <Field label="Échéance" htmlFor="due_date">
              <Input id="due_date" name="due_date" type="date" />
            </Field>
            {isAdmin ? (
              <Field label="Assignée à" htmlFor="assigned_to">
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
              <input
                type="hidden"
                name="assigned_to"
                value={currentProfileId}
              />
            )}
            <Field label="Client lié" htmlFor="client_id">
              <NativeSelect id="client_id" name="client_id" defaultValue="">
                <option value="">Aucun client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.company_name || client.contact_name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Projet lié" htmlFor="project_id">
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
          {state.success && (
            <div
              role="status"
              className="flex gap-3 rounded-lg border border-success/30 bg-success-muted p-3 text-sm text-success"
            >
              <CheckCircle2
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              <p>Tâche créée.</p>
            </div>
          )}
          {state.error && (
            <div
              role="alert"
              className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive-muted p-3 text-sm text-destructive"
            >
              <AlertTriangle
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              <p>{state.error}</p>
            </div>
          )}
          <div className="flex justify-end border-t pt-5">
            <Button type="submit" disabled={pending}>
              <Plus aria-hidden="true" />
              {pending ? "Création…" : "Créer la tâche"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
