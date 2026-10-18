import { Gift, Power } from "lucide-react";
import { createBonusRule, toggleRule } from "@/app/(dashboard)/actions";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/format";
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
import { Field } from "@/components/forms/form-fields";
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
  name: string;
  min_project_value: number;
  bonus_amount: number;
  is_active: boolean;
}
export const metadata = { title: "Règles de bonus" };
export default async function BonusRulesPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase
    .from("bonus_rules")
    .select("*")
    .order("min_project_value");
  const rules = (data ?? []) as Rule[];
  return (
    <div className="space-y-6">
      <PageHeader
        title="Règles de bonus"
        description="Le palier le plus élevé atteint est appliqué et figé."
      />
      <div className="grid items-start gap-6 xl:grid-cols-[1.4fr_.6fr]">
        <Card className="gap-0 py-0">
          <CardHeader className="border-b pt-4">
            <CardTitle>Bonus configurés</CardTitle>
            <CardDescription>
              Rémunérations fixes liées à la valeur finale du projet.
            </CardDescription>
          </CardHeader>
          {rules.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Palier</TableHead>
                  <TableHead className="text-right">Valeur minimale</TableHead>
                  <TableHead className="text-right">Bonus</TableHead>
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
                      <div className="flex items-center gap-3">
                        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-violet-muted text-violet">
                          <Gift className="size-4" aria-hidden="true" />
                        </span>
                        <span className="font-semibold">{r.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="tabular text-right">
                      <span className="text-subtle-foreground">≥ </span>
                      {formatCurrency(r.min_project_value)}
                    </TableCell>
                    <TableCell className="tabular text-right font-semibold text-success">
                      +{formatCurrency(r.bonus_amount)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        value={r.is_active ? "Active" : "Inactive"}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <form action={toggleRule}>
                        <input type="hidden" name="table" value="bonus_rules" />
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
                              ? `Désactiver la règle ${r.name}`
                              : `Activer la règle ${r.name}`
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
                icon={Gift}
                title="Aucun bonus configuré"
                description="Ajoutez un premier palier avec le formulaire."
              />
            </div>
          )}
        </Card>
        <Card className="gap-0 py-0">
          <CardHeader className="border-b pt-4">
            <CardTitle className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-violet-muted text-violet">
                <Gift className="size-4" aria-hidden="true" />
              </span>
              Nouveau bonus
            </CardTitle>
          </CardHeader>
          <CardContent className="py-5">
            <form action={createBonusRule} className="space-y-5">
              <Field label="Nom de la règle" htmlFor="name" required>
                <Input id="name" name="name" required />
              </Field>
              <Field
                label="Valeur minimale du projet"
                htmlFor="min_project_value"
                required
              >
                <Input
                  id="min_project_value"
                  name="min_project_value"
                  type="number"
                  min="0"
                  step="0.001"
                  required
                />
              </Field>
              <Field label="Montant du bonus" htmlFor="bonus_amount" required>
                <Input
                  id="bonus_amount"
                  name="bonus_amount"
                  type="number"
                  min="0"
                  step="0.001"
                  required
                />
              </Field>
              <Button type="submit" className="w-full">
                Ajouter le bonus
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
