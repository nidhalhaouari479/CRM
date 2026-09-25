"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
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
      error: error instanceof Error ? error.message : "Reclamation non envoyee.",
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
      <CardHeader>
        <CardTitle>Nouvelle reclamation</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-5">
          <Field label="Objet" htmlFor="subject" required>
            <Input id="subject" name="subject" required />
          </Field>
          <Field label="Details" htmlFor="details" required>
            <Textarea id="details" name="details" rows={5} required />
          </Field>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={pending}>
              <Send />
              {pending ? "Envoi..." : "Envoyer a l'admin"}
            </Button>
            {state.success && (
              <p className="text-sm text-emerald-700">Reclamation envoyee.</p>
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
