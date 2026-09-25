"use client";

import { frenchLabel } from "@/lib/labels";
import { useMemo } from "react";
import { CircleDollarSign } from "lucide-react";
import { createPayment } from "@/app/(dashboard)/actions";
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

export function PaymentFormDialog({
  projectId,
  remaining,
}: {
  projectId: string;
  remaining: number;
}) {
  const submissionKey = useMemo(() => crypto.randomUUID(), []);

  return (
    <Dialog>
      <DialogTrigger render={<Button />}>
        <CircleDollarSign /> Ajouter un paiement
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouveau paiement</DialogTitle>
          <DialogDescription>
            Le statut et le solde du projet seront recalculés automatiquement.
          </DialogDescription>
        </DialogHeader>
        <form action={createPayment} className="space-y-5">
          <input type="hidden" name="project_id" value={projectId} />
          <input type="hidden" name="submission_key" value={submissionKey} />
          <FormGrid>
            <Field label="Montant (TND)" htmlFor="amount" required>
              <Input
                id="amount"
                name="amount"
                type="number"
                min="0.001"
                max={remaining || undefined}
                step="0.001"
                required
              />
            </Field>
            <Field label="Date" htmlFor="payment_date" required>
              <Input
                id="payment_date"
                name="payment_date"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                required
              />
            </Field>
          </FormGrid>
          <Field label="Méthode" htmlFor="payment_method">
            <NativeSelect id="payment_method" name="payment_method">
              {["Cash", "Bank Transfer", "Card", "Online Payment", "Other"].map(
                (v) => (
                  <option key={v} value={v}>
                    {frenchLabel(v)}
                  </option>
                ),
              )}
            </NativeSelect>
          </Field>
          <Field label="Référence" htmlFor="reference">
            <Input id="reference" name="reference" />
          </Field>
          <Field label="Notes" htmlFor="notes">
            <Textarea id="notes" name="notes" />
          </Field>
          <DialogFooter>
            <SubmitButton pendingLabel="Enregistrement...">
              Enregistrer le paiement
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
