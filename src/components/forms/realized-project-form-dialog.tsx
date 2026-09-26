"use client";

import { useState } from "react";
import { ImagePlus, Plus, Trash2 } from "lucide-react";
import { createRealizedProject } from "@/app/(dashboard)/actions";
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
import { Field, FormGrid } from "@/components/forms/form-fields";
import { SubmitButton } from "@/components/forms/submit-button";

function DynamicInputs({
  label,
  name,
  placeholder,
  minItems = 1,
}: {
  label: string;
  name: string;
  placeholder: string;
  minItems?: number;
}) {
  const [items, setItems] = useState([""]);
  const canRemove = items.length > minItems;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">{label}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setItems((current) => [...current, ""])}
        >
          <Plus />
          Ajouter
        </Button>
      </div>
      <div className="space-y-2">
        {items.map((value, index) => (
          <div key={index} className="flex gap-2">
            <Input
              name={name}
              defaultValue={value}
              placeholder={placeholder}
              required={index < minItems}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Supprimer"
              disabled={!canRemove}
              onClick={() =>
                setItems((current) =>
                  current.filter((_, itemIndex) => itemIndex !== index),
                )
              }
            >
              <Trash2 />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RealizedProjectFormDialog() {
  const currentYear = new Date().getFullYear();

  return (
    <Dialog>
      <DialogTrigger render={<Button />}>
        <ImagePlus />
        Ajouter un projet realise
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Nouveau projet realise</DialogTitle>
          <DialogDescription>
            Ajoutez un projet livre avec ses stacks, liens et visuels.
          </DialogDescription>
        </DialogHeader>
        <form action={createRealizedProject} className="space-y-5">
          <FormGrid>
            <Field label="Nom de projet" htmlFor="name" required>
              <Input id="name" name="name" required />
            </Field>
            <Field label="Annee de projet" htmlFor="project_year" required>
              <Input
                id="project_year"
                name="project_year"
                type="number"
                min="1990"
                max={currentYear + 10}
                defaultValue={currentYear}
                required
              />
            </Field>
          </FormGrid>
          <Field label="Nom de client" htmlFor="client_name" required>
            <Input id="client_name" name="client_name" required />
          </Field>
          <Field label="Description" htmlFor="description" required>
            <Textarea id="description" name="description" required />
          </Field>
          <DynamicInputs
            label="Stacks"
            name="stacks"
            placeholder="React, Next.js, Supabase..."
          />
          <FormGrid>
            <Field label="Lien de site" htmlFor="project_url">
              <Input
                id="project_url"
                name="project_url"
                placeholder="https://..., In Progress ou Private"
              />
            </Field>
            <Field label="Lien GitHub" htmlFor="github_url">
              <Input
                id="github_url"
                name="github_url"
                placeholder="https://github.com/... ou Private"
              />
            </Field>
          </FormGrid>
          <DynamicInputs
            label="Images"
            name="image_urls"
            placeholder="https://image... ou Private"
            minItems={0}
          />
          <DialogFooter>
            <SubmitButton pendingLabel="Creation...">
              Creer le projet realise
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
