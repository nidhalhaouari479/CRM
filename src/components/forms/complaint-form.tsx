"use client";

import { useActionState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  MessageSquarePlus,
  Send,
} from "lucide-react";
import { createComplaint } from "@/app/(dashboard)/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/forms/form-fields";

async function submitComplaint(
  _previousState: { error: string; success: boolean },
  formData: FormData,
) {
  try {
    await createComplaint(formData);
    return { error: "", success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Réclamation non envoyée.",
      success: false,
    };
  }
}

export function ComplaintForm() {
  const [state, formAction, pending] = useActionState(submitComplaint, {
    error: "",
    success: false,
  });

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <MessageSquarePlus
            className="size-5 text-primary"
            aria-hidden="true"
          />
          Nouvelle réclamation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-5">
          <Field label="Objet" htmlFor="subject" required>
            <Input id="subject" name="subject" required />
          </Field>
          <Field label="Détails" htmlFor="details" required>
            <Textarea id="details" name="details" rows={5} required />
          </Field>
          {state.success && (
            <div
              role="status"
              className="flex gap-3 rounded-lg border border-success/30 bg-success-muted p-3 text-sm text-success"
            >
              <CheckCircle2
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              <p>Réclamation envoyée.</p>
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
              <Send aria-hidden="true" />
              {pending ? "Envoi…" : "Envoyer à l’administration"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
