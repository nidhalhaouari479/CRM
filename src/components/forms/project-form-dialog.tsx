"use client";

import { frenchLabel } from "@/lib/labels";

import { useMemo, useState } from "react";
import { FolderPlus } from "lucide-react";
import { createProject } from "@/app/(dashboard)/actions";
import { SERVICES } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormGrid, NativeSelect } from "@/components/forms/form-fields";
import { SubmitButton } from "@/components/forms/submit-button";

export function ProjectFormDialog({
  clientId,
  defaultService,
  defaultServiceOther,
}: {
  clientId: string;
  defaultService?: string;
  defaultServiceOther?: string | null;
}) {
  const [serviceType, setServiceType] = useState(defaultService || SERVICES[0]);
  const submissionKey = useMemo(() => crypto.randomUUID(), []);

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        <FolderPlus /> Ajouter un projet
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nouveau projet</DialogTitle>
          <DialogDescription>
            Créez le projet et définissez sa valeur commerciale.
          </DialogDescription>
        </DialogHeader>
        <form action={createProject} className="space-y-5">
          <input type="hidden" name="client_id" value={clientId} />
          <input type="hidden" name="submission_key" value={submissionKey} />
          <Field label="Nom du projet" htmlFor="name" required>
            <Input id="name" name="name" required />
          </Field>
          <FormGrid>
            <Field label="Service" htmlFor="service_type" required>
              <NativeSelect
                id="service_type"
                name="service_type"
                value={serviceType}
                onChange={(event) => setServiceType(event.target.value)}
                required
              >
                {SERVICES.map((s) => (
                  <option key={s} value={s}>
                    {frenchLabel(s)}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Statut" htmlFor="status">
              <NativeSelect id="status" name="status">
                {[
                  "Proposal",
                  "Confirmed",
                  "In Progress",
                  "On Hold",
                  "Completed",
                  "Cancelled",
                ].map((s) => (
                  <option key={s} value={s}>
                    {frenchLabel(s)}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </FormGrid>
          {serviceType === "Other" && (
            <Field
              label="Précisez le service du projet"
              htmlFor="service_type_other"
              required
            >
              <Input
                id="service_type_other"
                name="service_type_other"
                defaultValue={defaultServiceOther ?? ""}
                placeholder="Décrivez le service"
                required
              />
            </Field>
          )}
          <Field label="Description" htmlFor="description">
            <Textarea id="description" name="description" />
          </Field>
          <FormGrid>
            <Field label="Prix estimé (TND)" htmlFor="estimated_price">
              <Input
                id="estimated_price"
                name="estimated_price"
                type="number"
                min="0"
                step="0.001"
              />
            </Field>
            <Field label="Prix final (TND)" htmlFor="final_price" required>
              <Input
                id="final_price"
                name="final_price"
                type="number"
                min="0"
                step="0.001"
                required
              />
            </Field>
          </FormGrid>
          <FormGrid>
            <Field label="Date de début" htmlFor="start_date">
              <Input id="start_date" name="start_date" type="date" />
            </Field>
            <Field label="Fin prévue" htmlFor="expected_end_date">
              <Input
                id="expected_end_date"
                name="expected_end_date"
                type="date"
              />
            </Field>
          </FormGrid>
          <DialogFooter>
            <SubmitButton pendingLabel="Creation...">Créer le projet</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
