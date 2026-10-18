import { activityLabel, frenchLabel } from "@/lib/labels";
import { Clock3, Save, Settings2 } from "lucide-react";
import { updateSettings } from "@/app/(dashboard)/actions";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/layout/page-header";
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
import { Field, FormGrid, NativeSelect } from "@/components/forms/form-fields";

interface Settings {
  company_name: string;
  currency: string;
  locale: string;
}
interface Log {
  id: string;
  action: string;
  entity_type: string;
  created_at: string;
  metadata: Record<string, unknown>;
}
export const metadata = { title: "Paramètres" };
export default async function SettingsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const [{ data: settingsData }, { data: logsData }] = await Promise.all([
    supabase.from("app_settings").select("*").eq("id", true).single(),
    supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(12),
  ]);
  const settings = (settingsData ?? {
    company_name: "CRM Tunisie",
    currency: "TND",
    locale: "fr-TN",
  }) as Settings;
  const logs = (logsData ?? []) as Log[];
  return (
    <div className="space-y-6">
      <PageHeader
        title="Paramètres"
        description="Configuration générale et journal des actions sensibles."
      />
      <div className="grid items-start gap-6 lg:grid-cols-[.9fr_1.1fr]">
        <Card className="gap-0 py-0">
          <CardHeader className="border-b pt-4">
            <CardTitle className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-accent text-primary">
                <Settings2 className="size-4" aria-hidden="true" />
              </span>
              Paramètres généraux
            </CardTitle>
            <CardDescription>
              Ces valeurs s’appliquent à toute l’application.
            </CardDescription>
          </CardHeader>
          <form action={updateSettings}>
            <CardContent className="space-y-5 py-5">
              <Field
                label="Nom de l’entreprise"
                htmlFor="company_name"
                required
              >
                <Input
                  id="company_name"
                  name="company_name"
                  defaultValue={settings.company_name}
                  required
                />
              </Field>
              <FormGrid>
                <Field label="Devise" htmlFor="currency">
                  <NativeSelect
                    id="currency"
                    name="currency"
                    defaultValue={settings.currency}
                  >
                    <option>TND</option>
                    <option>EUR</option>
                    <option>USD</option>
                  </NativeSelect>
                </Field>
                <Field label="Langue" htmlFor="locale">
                  <NativeSelect
                    id="locale"
                    name="locale"
                    defaultValue={settings.locale}
                  >
                    <option value="fr-TN">Français (Tunisie)</option>
                    <option value="fr-FR">Français</option>
                    <option value="en-US">Anglais</option>
                  </NativeSelect>
                </Field>
              </FormGrid>
            </CardContent>
            <div className="flex justify-end border-t bg-muted/40 px-4 py-3">
              <Button type="submit">
                <Save aria-hidden="true" />
                Enregistrer les paramètres
              </Button>
            </div>
          </form>
        </Card>
        <Card className="gap-0 py-0">
          <CardHeader className="border-b pt-4">
            <CardTitle>Journal d’activité</CardTitle>
            <CardDescription>
              Dernières opérations enregistrées automatiquement.
            </CardDescription>
          </CardHeader>
          {logs.length ? (
            <ol className="divide-y">
              {logs.map((log) => (
                <li key={log.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                    <Clock3 className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {activityLabel(log.action)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {frenchLabel(log.entity_type)}
                    </p>
                  </div>
                  <time
                    dateTime={log.created_at}
                    className="tabular shrink-0 text-xs text-subtle-foreground"
                  >
                    {formatDate(log.created_at, true)}
                  </time>
                </li>
              ))}
            </ol>
          ) : (
            <div className="p-5">
              <EmptyState
                icon={Clock3}
                title="Le journal est vide"
                description="Les opérations sensibles apparaîtront ici automatiquement."
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
