import { Gift, Power } from "lucide-react";
import { createBonusRule, toggleRule } from "@/app/(dashboard)/actions";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/format";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/status-badge";
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
      <div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
        <Card>
          <CardHeader>
            <CardTitle>Bonus configurés</CardTitle>
            <CardDescription>
              Rémunérations fixes liées à la valeur finale du projet.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Valeur minimale</TableHead>
                  <TableHead>Bonus</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>{formatCurrency(r.min_project_value)}</TableCell>
                    <TableCell className="font-semibold text-emerald-700">
                      {formatCurrency(r.bonus_amount)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        value={r.is_active ? "Active" : "Inactive"}
                      />
                    </TableCell>
                    <TableCell>
                      <form action={toggleRule}>
                        <input type="hidden" name="table" value="bonus_rules" />
                        <input type="hidden" name="id" value={r.id} />
                        <input
                          type="hidden"
                          name="is_active"
                          value={String(r.is_active)}
                        />
                        <Button size="icon" variant="ghost">
                          <Power className="size-4" />
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="size-5 text-violet-600" />
              Nouveau bonus
            </CardTitle>
          </CardHeader>
          <CardContent>
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
