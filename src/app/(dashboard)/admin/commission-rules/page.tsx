import { Percent, Power } from "lucide-react";
import { createCommissionRule, toggleRule } from "@/app/(dashboard)/actions";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
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
      <div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
        <Card>
          <CardHeader>
            <CardTitle>Barème actif</CardTitle>
            <CardDescription>
              Les projets déjà commissionnés conservent leur ancien taux.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>De</TableHead>
                  <TableHead>Jusqu’à</TableHead>
                  <TableHead>Taux</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.min_projects} projets</TableCell>
                    <TableCell>
                      {r.max_projects == null
                        ? "Sans limite"
                        : `${r.max_projects} projets`}
                    </TableCell>
                    <TableCell className="font-semibold text-blue-700">
                      {r.commission_percentage}%
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        value={r.is_active ? "Active" : "Inactive"}
                      />
                    </TableCell>
                    <TableCell>
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
                          size="icon"
                          variant="ghost"
                          aria-label="Changer le statut"
                        >
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
              <Percent className="size-5 text-blue-600" />
              Nouvelle règle
            </CardTitle>
            <CardDescription>
              Évitez les plages qui se chevauchent.
            </CardDescription>
          </CardHeader>
          <CardContent>
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
