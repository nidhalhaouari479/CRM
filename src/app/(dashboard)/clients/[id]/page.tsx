import { frenchLabel } from "@/lib/labels";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Building2,
  CalendarClock,
  ExternalLink,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  UserRound,
} from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/format";
import type {
  Client,
  Interaction,
  Payment,
  Profile,
  Project,
} from "@/lib/types";
import { updateClientStatus } from "@/app/(dashboard)/actions";
import { InteractionFormDialog } from "@/components/forms/interaction-form-dialog";
import { ProjectFormDialog } from "@/components/forms/project-form-dialog";
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
import { NativeSelect } from "@/components/forms/form-fields";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireProfile();
  const { id } = await params;
  const supabase = await createClient();
  const [
    { data: clientData },
    { data: projectsData },
    { data: interactionsData },
  ] = await Promise.all([
    supabase
      .from("clients")
      .select("*, profiles(first_name, last_name, email, phone)")
      .eq("id", id)
      .single(),
    supabase
      .from("projects")
      .select("*")
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("interactions")
      .select("*")
      .eq("client_id", id)
      .order("date", { ascending: false }),
  ]);
  if (!clientData) notFound();
  const client = clientData as unknown as Client & {
    profiles: Pick<
      Profile,
      "first_name" | "last_name" | "email" | "phone"
    > | null;
  };
  const projects = (projectsData ?? []) as Project[];
  const interactions = (interactionsData ?? []) as Interaction[];
  const projectIds = projects.map((p) => p.id);
  const { data: paymentsData } = projectIds.length
    ? await supabase
        .from("payments")
        .select("*")
        .in("project_id", projectIds)
        .order("payment_date", { ascending: false })
    : { data: [] };
  const payments = (paymentsData ?? []) as Payment[];
  const totalValue = projects.reduce(
    (sum, p) => sum + Number(p.final_price),
    0,
  );
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalUnpaid = projects.reduce(
    (sum, project) => sum + Number(project.remaining_amount),
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={client.company_name}
        description={`${client.client_code}${client.contact_name ? ` · ${client.contact_name}` : ""} · Ajouté par : ${client.profiles ? `${client.profiles.first_name} ${client.profiles.last_name}` : "—"}`}
        action={
          <div className="flex flex-wrap gap-2">
            <InteractionFormDialog clientId={id} />
            <ProjectFormDialog
              clientId={id}
              defaultService={client.service_type}
              defaultServiceOther={client.service_type_other}
            />
          </div>
        }
      />
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge value={client.sales_status} />
        <StatusBadge value={client.priority} />
        <form action={updateClientStatus} className="flex items-center gap-2">
          <input type="hidden" name="id" value={id} />
          <NativeSelect
            name="sales_status"
            defaultValue={client.sales_status}
            className="w-44"
          >
            {[
              "New",
              "Contacted",
              "In Discussion",
              "Waiting",
              "Confirmed",
              "Lost",
              "Converted",
            ].map((v) => (
              <option key={v} value={v}>
                {frenchLabel(v)}
              </option>
            ))}
          </NativeSelect>
          <Button type="submit" variant="outline" size="sm">
            Mettre à jour
          </Button>
        </form>
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_1fr_.75fr]">
        <Card>
          <CardHeader>
            <CardTitle>Coordonnées</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <Info icon={Phone} label="Téléphone" value={client.phone} />
            <Info icon={Mail} label="Courriel" value={client.email} />
            <Info
              icon={ExternalLink}
              label="Site web"
              value={client.website}
              link
            />
            <Info
              icon={ExternalLink}
              label="Facebook"
              value={client.facebook_url}
              link
            />
            <Info
              icon={ExternalLink}
              label="Instagram"
              value={client.instagram_url}
              link
            />
            <Info
              icon={MapPin}
              label="Adresse"
              value={[client.address, client.city, client.country]
                .filter(Boolean)
                .join(", ")}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Informations commerciales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <Info
              icon={Building2}
              label="Type"
              value={frenchLabel(client.client_type)}
            />
            <Info
              icon={Building2}
              label="Secteur"
              value={client.business_sector}
            />
            <Info
              icon={UserRound}
              label="Nom du contact"
              value={client.contact_name}
            />
            <Info
              icon={UserRound}
              label="Poste du contact"
              value={client.contact_position}
            />
            <Info
              icon={UserRound}
              label="Service demandé"
              value={frenchLabel(client.service_type)}
            />
            <Info
              icon={CalendarClock}
              label="Budget estimé"
              value={formatCurrency(client.estimated_budget)}
            />
            {client.notes && (
              <div className="rounded-lg bg-slate-50 p-3 text-slate-600">
                {client.notes}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Situation financière</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-500">Nombre de projets</p>
              <p className="text-2xl font-semibold">{projects.length}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Valeur totale</p>
              <p className="text-2xl font-semibold">
                {formatCurrency(totalValue)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Encaissé</p>
              <p className="text-xl font-semibold text-emerald-700">
                {formatCurrency(totalPaid)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Reste</p>
              <p className="text-xl font-semibold text-amber-700">
                {formatCurrency(totalUnpaid)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Projets</CardTitle>
          <CardDescription>
            {projects.length} projet(s) lié(s) au client
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Projet</TableHead>
                <TableHead>Valeur</TableHead>
                <TableHead>Payé</TableHead>
                <TableHead>Reste</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Paiement</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <Link
                      href={`/projects/${project.id}`}
                      className="font-medium hover:text-blue-600"
                    >
                      {project.name}
                    </Link>
                  </TableCell>
                  <TableCell>{formatCurrency(project.final_price)}</TableCell>
                  <TableCell>
                    {formatCurrency(project.payment_amount)}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(project.remaining_amount)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={project.status} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={project.payment_status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!projects.length && (
            <p className="p-8 text-center text-sm text-slate-500">
              Aucun projet pour ce client.
            </p>
          )}
        </CardContent>
      </Card>
      <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Historique des interactions</CardTitle>
            <CardDescription>Chronologie complète des échanges</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative space-y-6 before:absolute before:bottom-3 before:left-[17px] before:top-3 before:w-px before:bg-slate-200">
              {interactions.map((item) => (
                <div key={item.id} className="relative flex gap-4">
                  <span className="z-10 grid size-9 shrink-0 place-items-center rounded-full border bg-white text-blue-600">
                    <MessageSquareText className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1 rounded-xl border bg-white p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">{item.objective}</p>
                      <span className="text-xs text-slate-500">
                        {formatDate(item.date, true)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      {item.conclusion}
                    </p>
                    <InteractionDetails interaction={item} />
                    {item.next_action && (
                      <p className="mt-3 rounded-lg bg-blue-50 p-2 text-xs text-blue-800">
                        <strong>Prochaine action :</strong> {item.next_action}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {!interactions.length && (
                <p className="pl-12 text-sm text-slate-500">
                  Aucune interaction enregistrée.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Paiements</CardTitle>
            <CardDescription>Historique des encaissements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="text-sm font-medium">
                    {frenchLabel(payment.payment_method)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatDate(payment.payment_date)} ·{" "}
                    {payment.reference || "Sans référence"}
                  </p>
                </div>
                <p className="font-semibold text-emerald-700">
                  + {formatCurrency(payment.amount)}
                </p>
              </div>
            ))}
            {!payments.length && (
              <p className="py-8 text-center text-sm text-slate-500">
                Aucun paiement.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InteractionDetails({ interaction }: { interaction: Interaction }) {
  const details: Array<[string, string | number | null]> = [
    ["Type", frenchLabel(interaction.type)],
    [
      "Duree",
      interaction.duration_minutes == null
        ? null
        : `${interaction.duration_minutes} min`,
    ],
    ["Resultat", interaction.result],
    ["Score d'interet", `${interaction.interest_score}/10`],
  ];

  const visibleDetails = details.filter(
    ([, value]) => value !== null && value !== "",
  );
  if (!visibleDetails.length) return null;

  return (
    <dl className="mt-3 grid gap-2 rounded-lg bg-slate-50 p-3 text-xs sm:grid-cols-2">
      {visibleDetails.map(([label, value]) => (
        <div key={label}>
          <dt className="text-slate-500">{label}</dt>
          <dd className="mt-0.5 font-medium text-slate-800">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Info({
  icon: Icon,
  label,
  value,
  link,
}: {
  icon: typeof Phone;
  label: string;
  value?: string | null;
  link?: boolean;
}) {
  const display = value || "—";
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-slate-400" />
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        {link && value ? (
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-blue-600 hover:underline"
          >
            {display}
          </a>
        ) : (
          <p className="font-medium">{display}</p>
        )}
      </div>
    </div>
  );
}
