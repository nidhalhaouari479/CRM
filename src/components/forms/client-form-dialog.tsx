"use client";

import { useActionState, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { createClient, updateClient } from "@/app/(dashboard)/actions";
import { frenchLabel } from "@/lib/labels";
import { BUSINESS_SECTORS, SERVICES, type Client } from "@/lib/types";
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

export function ClientFormDialog({ client }: { client?: Client }) {
  const isEditing = !!client;
  const action = isEditing ? updateClient : createClient;
  const [state, formAction, pending] = useActionState(action, { error: "" });
  const [businessSector, setBusinessSector] = useState(
    client?.business_sector ?? "",
  );
  const [serviceType, setServiceType] = useState(client?.service_type ?? "");

  return (
    <Dialog>
      <DialogTrigger
        render={<Button variant={isEditing ? "outline" : "default"} />}
      >
        {isEditing ? <Pencil /> : <Plus />}
        {isEditing ? "Modifier" : "Ajouter un client"}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier le client" : "Nouveau client"}
          </DialogTitle>
          <DialogDescription>
            Ajoutez les coordonnees et qualifiez l&apos;opportunite.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-5">
          {client?.id && <input type="hidden" name="id" value={client.id} />}
          <FormGrid>
            <Field label="Nom de l'agence" htmlFor="company_name" required>
              <Input
                id="company_name"
                name="company_name"
                defaultValue={client?.company_name ?? ""}
                required
              />
            </Field>
            <Field label="Telephone" htmlFor="phone">
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={client?.phone ?? ""}
              />
            </Field>
          </FormGrid>
          <FormGrid>
            <Field label="Nom du contact (facultatif)" htmlFor="contact_name">
              <Input
                id="contact_name"
                name="contact_name"
                defaultValue={client?.contact_name ?? ""}
              />
            </Field>
            <Field
              label="Poste du contact (facultatif)"
              htmlFor="contact_position"
            >
              <Input
                id="contact_position"
                name="contact_position"
                placeholder="Responsable, fondateur..."
                defaultValue={client?.contact_position ?? ""}
              />
            </Field>
          </FormGrid>
          <FormGrid>
            <Field label="Courriel (facultatif)" htmlFor="email">
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={client?.email ?? ""}
              />
            </Field>
            <Field
              label="Secteur d'activite (facultatif)"
              htmlFor="business_sector"
            >
              <NativeSelect
                id="business_sector"
                name="business_sector"
                value={businessSector}
                onChange={(event) => setBusinessSector(event.target.value)}
              >
                <option value="">Selectionner</option>
                {BUSINESS_SECTORS.map((sector) => (
                  <option key={sector}>{sector}</option>
                ))}
              </NativeSelect>
            </Field>
          </FormGrid>
          {businessSector === "Autre" && (
            <Field
              label="Precisez le secteur d'activite"
              htmlFor="business_sector_other"
              required
            >
              <Input
                id="business_sector_other"
                name="business_sector_other"
                placeholder="Ex. media, artisanat, association..."
                defaultValue={client?.business_sector_other ?? ""}
                required
              />
            </Field>
          )}
          <FormGrid>
            <Field label="Type" htmlFor="client_type">
              <NativeSelect
                id="client_type"
                name="client_type"
                defaultValue={client?.client_type ?? "Company"}
              >
                <option value="Company">{frenchLabel("Company")}</option>
                <option value="Individual">{frenchLabel("Individual")}</option>
              </NativeSelect>
            </Field>
            <Field label="Service" htmlFor="service_type" required>
              <NativeSelect
                id="service_type"
                name="service_type"
                value={serviceType}
                onChange={(event) => setServiceType(event.target.value)}
                required
              >
                <option value="">Selectionner</option>
                {SERVICES.map((service) => (
                  <option key={service} value={service}>
                    {frenchLabel(service)}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </FormGrid>
          {serviceType === "Other" && (
            <Field
              label="Precisez le service demande"
              htmlFor="service_type_other"
              required
            >
              <Input
                id="service_type_other"
                name="service_type_other"
                placeholder="Decrivez le service"
                defaultValue={client?.service_type_other ?? ""}
                required
              />
            </Field>
          )}
          <FormGrid>
            <Field label="Budget estime (TND)" htmlFor="estimated_budget">
              <Input
                id="estimated_budget"
                name="estimated_budget"
                type="number"
                min="0"
                step="0.001"
                defaultValue={client?.estimated_budget ?? ""}
              />
            </Field>
            <Field label="Site web" htmlFor="website">
              <Input
                id="website"
                name="website"
                type="url"
                defaultValue={client?.website ?? ""}
              />
            </Field>
          </FormGrid>
          <FormGrid>
            <Field label="Page Facebook" htmlFor="facebook_url">
              <Input
                id="facebook_url"
                name="facebook_url"
                type="url"
                placeholder="https://facebook.com/..."
                defaultValue={client?.facebook_url ?? ""}
              />
            </Field>
            <Field label="Page Instagram" htmlFor="instagram_url">
              <Input
                id="instagram_url"
                name="instagram_url"
                type="url"
                placeholder="https://instagram.com/..."
                defaultValue={client?.instagram_url ?? ""}
              />
            </Field>
          </FormGrid>
          <Field label="Adresse" htmlFor="address">
            <Input
              id="address"
              name="address"
              defaultValue={client?.address ?? ""}
            />
          </Field>
          <FormGrid>
            <Field label="Ville" htmlFor="city">
              <Input id="city" name="city" defaultValue={client?.city ?? ""} />
            </Field>
            <Field label="Pays" htmlFor="country">
              <Input
                id="country"
                name="country"
                defaultValue={client?.country ?? "Tunisie"}
              />
            </Field>
          </FormGrid>
          <FormGrid>
            <Field label="Statut commercial" htmlFor="sales_status">
              <NativeSelect
                id="sales_status"
                name="sales_status"
                defaultValue={client?.sales_status ?? "New"}
              >
                {[
                  "New",
                  "Contacted",
                  "In Discussion",
                  "Waiting",
                  "Confirmed",
                  "Lost",
                  "Converted",
                ].map((status) => (
                  <option key={status} value={status}>
                    {frenchLabel(status)}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Priorite" htmlFor="priority">
              <NativeSelect
                id="priority"
                name="priority"
                defaultValue={client?.priority ?? "Medium"}
              >
                <option value="Low">{frenchLabel("Low")}</option>
                <option value="Medium">{frenchLabel("Medium")}</option>
                <option value="High">{frenchLabel("High")}</option>
              </NativeSelect>
            </Field>
          </FormGrid>
          <Field label="Notes" htmlFor="notes">
            <Textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={client?.notes ?? ""}
            />
          </Field>
          <DialogFooter>
            {state.error && (
              <p role="alert" className="text-sm text-red-600">
                {state.error}
              </p>
            )}
            <Button type="submit" disabled={pending}>
              {pending
                ? "Enregistrement..."
                : isEditing
                  ? "Modifier le client"
                  : "Creer le client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
