import { Percent, Power } from "lucide-react";
import { createCommissionRule, toggleRule } from "@/app/(dashboard)/actions";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, FormGrid } from "@/components/forms/form-fields";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Rule {
  id: string;
  min_projects: number;
  max_projects: number | null;
  commission_percentage: number;
  is_active: boolean;
}
export const metadata = { title: "Règles de commission" };
export default async function CommissionRulesPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("commission_rules")
    .select("*")
    .order("min_projects");
  const rules = (data ?? []) as Rule[];
  return (
    <div className="space-y-6">
      <PageHeader
        title="Règles de commission"
        description="Définissez le taux selon le nombre de projets commissionnés."
      />
      <div className="grid items-start gap-6 xl:grid-cols-[1.4fr_.6fr]">
        <Card className="gap-0 py-0">
          <CardHeader className="border-b pt-4">
            <CardTitle>Barème actif</CardTitle>
            <CardDescription>
              Les projets déjà commissionnés conservent leur ancien taux.
            </CardDescription>
          </CardHeader>
          {rules.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plage de projets</TableHead>
                  <TableHead className="text-right">Taux</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((r) => (
                  <TableRow
                    key={r.id}
                    className={
                      r.is_active ? undefined : "text-muted-foreground"
                    }
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="tabular inline-flex h-7 min-w-10 items-center justify-center rounded-md bg-muted px-2 font-semibold">
                          {r.min_projects}
                        </span>
                        <span
                          className="text-subtle-foreground"
                          aria-hidden="true"
                        >
                          →
                        </span>
                        <span className="sr-only">à</span>
                        <span className="tabular inline-flex h-7 min-w-10 items-center justify-center rounded-md bg-muted px-2 font-semibold">
                          {r.max_projects == null ? "∞" : r.max_projects}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {r.max_projects == null
                            ? "projets, sans limite"
                            : "projets"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="tabular text-right text-base font-semibold text-primary">
                      {r.commission_percentage}%
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        value={r.is_active ? "Active" : "Inactive"}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <form action={toggleRule}>
                        <input
                          type="hidden"
                          name="table"
                          value="commission_rules"
                        />
                        <input type="hidden" name="id" value={r.id} />
                        <input
                          type="hidden"
                          name="is_active"
                          value={String(r.is_active)}
                        />
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label={
                            r.is_active
                              ? "Désactiver la règle"
                              : "Activer la règle"
                          }
                          title={r.is_active ? "Désactiver" : "Activer"}
                        >
                          <Power aria-hidden="true" />
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-5">
              <EmptyState
                icon={Percent}
                title="Aucune règle de commission"
                description="Ajoutez une première plage avec le formulaire."
              />
            </div>
          )}
        </Card>
        <Card className="gap-0 py-0">
          <CardHeader className="border-b pt-4">
            <CardTitle className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-accent text-primary">
                <Percent className="size-4" aria-hidden="true" />
              </span>
              Nouvelle règle
            </CardTitle>
            <CardDescription>
              Évitez les plages qui se chevauchent.
            </CardDescription>
          </CardHeader>
          <CardContent className="py-5">
            <form action={createCommissionRule} className="space-y-5">
              <FormGrid>
                <Field label="Minimum" htmlFor="min_projects" required>
                  <Input
                    id="min_projects"
                    name="min_projects"
                    type="number"
                    min="0"
                    required
                  />
                </Field>
                <Field label="Maximum" htmlFor="max_projects">
                  <Input
                    id="max_projects"
                    name="max_projects"
                    type="number"
                    min="0"
                    placeholder="Illimité"
                  />
                </Field>
              </FormGrid>
              <Field
                label="Pourcentage"
                htmlFor="commission_percentage"
                required
              >
                <Input
                  id="commission_percentage"
                  name="commission_percentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  required
                />
              </Field>
              <Button type="submit" className="w-full">
                Ajouter la règle
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
