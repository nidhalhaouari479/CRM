import { activityLabel, frenchLabel } from "@/lib/labels";
import { Clock3, Settings2 } from "lucide-react";
import { updateSettings } from "@/app/(dashboard)/actions";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/layout/page-header";
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
      <div className="grid gap-5 lg:grid-cols-[.85fr_1.15fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="size-5 text-blue-600" />
              Paramètres généraux
            </CardTitle>
            <CardDescription>
              Ces valeurs s’appliquent à toute l’application.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateSettings} className="space-y-5">
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
              <Button type="submit">Enregistrer les paramètres</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Journal d’activité</CardTitle>
            <CardDescription>
              Dernières opérations enregistrées automatiquement.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center gap-3 border-b py-3 last:border-0"
              >
                <span className="grid size-8 place-items-center rounded-full bg-slate-100 text-slate-500">
                  <Clock3 className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {activityLabel(log.action)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {frenchLabel(log.entity_type)}
                  </p>
                </div>
                <span className="text-xs text-slate-400">
                  {formatDate(log.created_at, true)}
                </span>
              </div>
            ))}
            {!logs.length && (
              <p className="py-10 text-center text-sm text-slate-500">
                Le journal est vide.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
