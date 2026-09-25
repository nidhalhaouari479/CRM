import { UserPlus } from "lucide-react";
import { createEmployee } from "@/app/(dashboard)/actions";
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
import { Field, FormGrid } from "@/components/forms/form-fields";

export function EmployeeFormDialog() {
  return (
    <Dialog>
      <DialogTrigger render={<Button />}>
        <UserPlus /> Créer un employé
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouveau collaborateur</DialogTitle>
          <DialogDescription>
            Un compte Supabase Auth confirmé sera créé sans inscription
            publique.
          </DialogDescription>
        </DialogHeader>
        <form action={createEmployee} className="space-y-5">
          <FormGrid>
            <Field label="Prénom" htmlFor="first_name" required>
              <Input id="first_name" name="first_name" required />
            </Field>
            <Field label="Nom" htmlFor="last_name" required>
              <Input id="last_name" name="last_name" required />
            </Field>
          </FormGrid>
          <Field label="Courriel" htmlFor="email" required>
            <Input id="email" name="email" type="email" required />
          </Field>
          <Field label="Téléphone" htmlFor="phone">
            <Input id="phone" name="phone" />
          </Field>
          <Field label="Mot de passe temporaire" htmlFor="password" required>
            <Input
              id="password"
              name="password"
              type="password"
              minLength={8}
              required
            />
          </Field>
          <DialogFooter>
            <Button type="submit">Créer le compte</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
