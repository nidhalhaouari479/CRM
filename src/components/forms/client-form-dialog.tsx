"use client";

import { frenchLabel } from "@/lib/labels";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { createClient } from "@/app/(dashboard)/actions";
import { BUSINESS_SECTORS, SERVICES } from "@/lib/types";
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

export function ClientFormDialog() {
  const [state, formAction, pending] = useActionState(createClient, {
    error: "",
  });
  const [businessSector, setBusinessSector] = useState("");
  const [serviceType, setServiceType] = useState("");

  return (
    <Dialog>
      <DialogTrigger render={<Button />}>
        <Plus /> Ajouter un client
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nouveau client</DialogTitle>
          <DialogDescription>
            Ajoutez les coordonnées et qualifiez l’opportunité.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-5">
          <FormGrid>
            <Field label="Nom de l’agence" htmlFor="company_name" required>
              <Input id="company_name" name="company_name" required />
            </Field>
            <Field label="Téléphone" htmlFor="phone" required>
              <Input id="phone" name="phone" type="tel" required />
            </Field>
          </FormGrid>
          <FormGrid>
            <Field label="Nom du contact (facultatif)" htmlFor="contact_name">
              <Input id="contact_name" name="contact_name" />
            </Field>
            <Field
              label="Poste du contact (facultatif)"
              htmlFor="contact_position"
            >
              <Input
                id="contact_position"
                name="contact_position"
                placeholder="Responsable, fondateur…"
              />
            </Field>
          </FormGrid>
          <FormGrid>
            <Field label="Courriel (facultatif)" htmlFor="email">
              <Input id="email" name="email" type="email" />
            </Field>
            <Field
              label="Secteur d’activité (facultatif)"
              htmlFor="business_sector"
            >
              <NativeSelect
                id="business_sector"
                name="business_sector"
                value={businessSector}
                onChange={(event) => setBusinessSector(event.target.value)}
              >
                <option value="">Sélectionner</option>
                {BUSINESS_SECTORS.map((sector) => (
                  <option key={sector}>{sector}</option>
                ))}
              </NativeSelect>
            </Field>
          </FormGrid>
          {businessSector === "Autre" && (
            <Field
              label="Précisez le secteur d’activité"
              htmlFor="business_sector_other"
              required
            >
              <Input
                id="business_sector_other"
                name="business_sector_other"
                placeholder="Ex. média, artisanat, association…"
                required
              />
            </Field>
          )}
          <FormGrid>
            <Field label="Type" htmlFor="client_type">
              <NativeSelect id="client_type" name="client_type">
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
                <option value="">Sélectionner</option>
                {SERVICES.map((s) => (
                  <option key={s} value={s}>
                    {frenchLabel(s)}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </FormGrid>
          {serviceType === "Other" && (
            <Field
              label="Précisez le service demandé"
              htmlFor="service_type_other"
              required
            >
              <Input
                id="service_type_other"
                name="service_type_other"
                placeholder="Décrivez le service"
                required
              />
            </Field>
          )}
          <FormGrid>
            <Field label="Budget estimé (TND)" htmlFor="estimated_budget">
              <Input
                id="estimated_budget"
                name="estimated_budget"
                type="number"
                min="0"
                step="0.001"
              />
            </Field>
            <Field label="Site web" htmlFor="website">
              <Input id="website" name="website" type="url" />
            </Field>
          </FormGrid>
          <FormGrid>
            <Field label="Page Facebook" htmlFor="facebook_url">
              <Input
                id="facebook_url"
                name="facebook_url"
                type="url"
                placeholder="https://facebook.com/..."
              />
            </Field>
            <Field label="Page Instagram" htmlFor="instagram_url">
              <Input
                id="instagram_url"
                name="instagram_url"
                type="url"
                placeholder="https://instagram.com/..."
              />
            </Field>
          </FormGrid>
          <Field label="Adresse" htmlFor="address">
            <Input id="address" name="address" />
          </Field>
          <FormGrid>
            <Field label="Ville" htmlFor="city">
              <Input id="city" name="city" />
            </Field>
            <Field label="Pays" htmlFor="country">
              <Input id="country" name="country" defaultValue="Tunisie" />
            </Field>
          </FormGrid>
          <FormGrid>
            <Field label="Statut commercial" htmlFor="sales_status">
              <NativeSelect id="sales_status" name="sales_status">
                {[
                  "New",
                  "Contacted",
                  "In Discussion",
                  "Waiting",
                  "Confirmed",
                  "Lost",
                  "Converted",
                ].map((s) => (
                  <option key={s} value={s}>
                    {frenchLabel(s)}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Priorité" htmlFor="priority">
              <NativeSelect id="priority" name="priority" defaultValue="Medium">
                <option value="Low">{frenchLabel("Low")}</option>
                <option value="Medium">{frenchLabel("Medium")}</option>
                <option value="High">{frenchLabel("High")}</option>
              </NativeSelect>
            </Field>
          </FormGrid>
          <Field label="Notes" htmlFor="notes">
            <Textarea id="notes" name="notes" rows={3} />
          </Field>
          <DialogFooter>
            {state.error && (
              <p role="alert" className="text-sm text-red-600">
                {state.error}
              </p>
            )}
            <Button type="submit" disabled={pending}>
              {pending ? "Enregistrement…" : "Créer le client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
