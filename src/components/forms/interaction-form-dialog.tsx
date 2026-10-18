"use client";

import { useActionState, useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { createInteraction } from "@/app/(dashboard)/actions";
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

type InteractionType =
  | "Message"
  | "Email"
  | "Telephone"
  | "Meeting en ligne"
  | "Meeting face a face";

export function InteractionFormDialog({ clientId }: { clientId: string }) {
  const [state, formAction, pending] = useActionState(createInteraction, {
    error: "",
    success: false,
  });
  const [type, setType] = useState<InteractionType>("Telephone");
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const needsDuration =
    type === "Telephone" ||
    type === "Meeting en ligne" ||
    type === "Meeting face a face";

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        <MessageSquarePlus /> Ajouter une interaction
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nouvelle interaction</DialogTitle>
          <DialogDescription>
            Consignez l’échange avec les champs essentiels.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-5">
          <input type="hidden" name="client_id" value={clientId} />
          <FormGrid>
            <Field label="Type" htmlFor="type" required>
              <NativeSelect
                id="type"
                name="type"
                value={type}
                onChange={(event) =>
                  setType(event.target.value as InteractionType)
                }
              >
                <option value="Message">Message</option>
                <option value="Email">Email</option>
                <option value="Telephone">Téléphone</option>
                <option value="Meeting en ligne">Meeting en ligne</option>
                <option value="Meeting face a face">Face à face</option>
              </NativeSelect>
            </Field>
            {needsDuration && (
              <Field label="Date et heure" htmlFor="date" required>
                <Input
                  id="date"
                  name="date"
                  type="datetime-local"
                  defaultValue={now.toISOString().slice(0, 16)}
                  required
                />
              </Field>
            )}
          </FormGrid>
          {needsDuration && (
            <Field label="Durée (minutes)" htmlFor="duration_minutes" required>
              <Input
                id="duration_minutes"
                name="duration_minutes"
                type="number"
                min="0"
                required
              />
            </Field>
          )}
          <Field label="Objectif" htmlFor="objective" required>
            <Input id="objective" name="objective" required />
          </Field>
          <Field label="Résultat" htmlFor="result" required>
            <Textarea id="result" name="result" rows={3} required />
          </Field>
          {!needsDuration && (
            <Field label="Conclusion" htmlFor="conclusion" required>
              <Textarea id="conclusion" name="conclusion" rows={3} required />
            </Field>
          )}
          <FormGrid>
            <Field
              label="Score d’intérêt /10"
              htmlFor="interest_score"
              required
            >
              <Input
                id="interest_score"
                name="interest_score"
                type="number"
                min="0"
                max="10"
                defaultValue="0"
                required
              />
            </Field>
            <Field label="Prochaine action (facultative)" htmlFor="next_action">
              <Input id="next_action" name="next_action" />
            </Field>
          </FormGrid>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Enregistrement…" : "Enregistrer l’interaction"}
            </Button>
          </DialogFooter>
          {state.error && (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          )}
          {state.success && (
            <p role="status" className="text-sm text-success">
              Interaction enregistrée.
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
