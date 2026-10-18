import { frenchLabel } from "@/lib/labels";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Banknote,
  Building2,
  CalendarClock,
  ExternalLink,
  FolderKanban,
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
import { ClientFormDialog } from "@/components/forms/client-form-dialog";
import { InteractionFormDialog } from "@/components/forms/interaction-form-dialog";
import { ProjectFormDialog } from "@/components/forms/project-form-dialog";
import { EmptyState } from "@/components/empty-state";
import { EntityAvatar } from "@/components/entity-avatar";
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
  const addedBy = client.profiles
    ? `${client.profiles.first_name} ${client.profiles.last_name}`
    : "—";

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-5 border-b pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <EntityAvatar
            name={client.company_name}
            className="size-12 rounded-xl text-sm"
          />
          <div className="min-w-0 space-y-2.5">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-[1.75rem]">
                {client.company_name}
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                <span className="tabular">{client.client_code}</span>
                {client.contact_name ? ` · ${client.contact_name}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge value={client.sales_status} />
              <StatusBadge value={client.priority} />
            </div>
            <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
              {client.phone && (
                <li className="flex items-center gap-1.5">
                  <Phone
                    className="size-3.5 text-subtle-foreground"
                    aria-hidden="true"
                  />
                  <span className="tabular">{client.phone}</span>
                </li>
              )}
              {client.email && (
                <li className="flex min-w-0 items-center gap-1.5">
                  <Mail
                    className="size-3.5 shrink-0 text-subtle-foreground"
                    aria-hidden="true"
                  />
                  <span className="truncate">{client.email}</span>
                </li>
              )}
              <li className="flex items-center gap-1.5">
                <UserRound
                  className="size-3.5 text-subtle-foreground"
                  aria-hidden="true"
                />
                Ajouté par :{" "}
                <span className="font-medium text-foreground">{addedBy}</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <ClientFormDialog client={client} />
          <InteractionFormDialog clientId={id} />
          <ProjectFormDialog
            clientId={id}
            defaultService={client.service_type}
            defaultServiceOther={client.service_type_other}
          />
        </div>
      </header>
      <form
        action={updateClientStatus}
        className="flex flex-wrap items-center gap-3 rounded-xl bg-card p-3 shadow-card ring-1 ring-border"
      >
        <input type="hidden" name="id" value={id} />
        <label
          htmlFor="sales_status"
          className="text-sm font-medium text-muted-foreground"
        >
          Statut commercial
        </label>
        <NativeSelect
          id="sales_status"
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
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr_.75fr]">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Coordonnées</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 text-sm">
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
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Informations commerciales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
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
                numeric
              />
            </dl>
            {client.notes && (
              <div className="rounded-lg bg-muted p-3 text-sm leading-relaxed text-muted-foreground">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-subtle-foreground">
                  Notes
                </p>
                <p className="whitespace-pre-line">{client.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Situation financière</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-5 xl:grid-cols-1">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Nombre de projets
                </dt>
                <dd className="tabular mt-1 text-2xl font-bold">
                  {projects.length}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Valeur totale
                </dt>
                <dd className="tabular mt-1 text-2xl font-bold">
                  {formatCurrency(totalValue)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Encaissé
                </dt>
                <dd className="tabular mt-1 text-xl font-bold text-success">
                  {formatCurrency(totalPaid)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Reste
                </dt>
                <dd className="tabular mt-1 text-xl font-bold text-warning">
                  {formatCurrency(totalUnpaid)}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
      <Card className="gap-0 pb-0">
        <CardHeader className="border-b">
          <CardTitle>Projets</CardTitle>
          <CardDescription>
            {projects.length} projet(s) lié(s) au client
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {projects.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Projet</TableHead>
                  <TableHead className="text-right">Valeur</TableHead>
                  <TableHead className="text-right">Payé</TableHead>
                  <TableHead className="text-right">Reste</TableHead>
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
                        className="font-semibold hover:text-primary"
                      >
                        {project.name}
                      </Link>
                    </TableCell>
                    <TableCell className="tabular text-right font-medium">
                      {formatCurrency(project.final_price)}
                    </TableCell>
                    <TableCell className="tabular text-right text-muted-foreground">
                      {formatCurrency(project.payment_amount)}
                    </TableCell>
                    <TableCell
                      className={
                        Number(project.remaining_amount) > 0
                          ? "tabular text-right font-medium text-warning"
                          : "tabular text-right text-muted-foreground"
                      }
                    >
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
          ) : (
            <div className="p-5">
              <EmptyState
                icon={FolderKanban}
                title="Aucun projet"
                description="Aucun projet pour ce client."
              />
            </div>
          )}
        </CardContent>
      </Card>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Historique des interactions</CardTitle>
            <CardDescription>Chronologie complète des échanges</CardDescription>
          </CardHeader>
          <CardContent>
            {interactions.length ? (
              <ol className="relative space-y-5 before:absolute before:inset-y-2 before:left-[17px] before:w-px before:bg-border">
                {interactions.map((item) => (
                  <li key={item.id} className="relative flex gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-primary ring-4 ring-card">
                      <MessageSquareText
                        className="size-4"
                        aria-hidden="true"
                      />
                    </span>
                    <div className="min-w-0 flex-1 rounded-xl border bg-card p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold">{item.objective}</p>
                        <time
                          dateTime={item.date}
                          className="text-xs text-subtle-foreground"
                        >
                          {formatDate(item.date, true)}
                        </time>
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        {item.conclusion}
                      </p>
                      <InteractionDetails interaction={item} />
                      {item.next_action && (
                        <p className="mt-3 rounded-lg bg-accent px-3 py-2 text-xs text-accent-foreground">
                          <strong className="font-semibold">
                            Prochaine action :
                          </strong>{" "}
                          {item.next_action}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState
                icon={MessageSquareText}
                title="Aucune interaction"
                description="Aucune interaction enregistrée pour ce client."
              />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Paiements</CardTitle>
            <CardDescription>Historique des encaissements</CardDescription>
          </CardHeader>
          <CardContent>
            {payments.length ? (
              <ul className="divide-y">
                {payments.map((payment) => (
                  <li
                    key={payment.id}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-success-muted text-success">
                        <Banknote className="size-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">
                          {frenchLabel(payment.payment_method)}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          <time dateTime={payment.payment_date}>
                            {formatDate(payment.payment_date)}
                          </time>{" "}
                          · {payment.reference || "Sans référence"}
                        </p>
                      </div>
                    </div>
                    <p className="tabular shrink-0 font-bold text-success">
                      + {formatCurrency(payment.amount)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={Banknote}
                title="Aucun paiement"
                description="Les encaissements des projets apparaîtront ici."
              />
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
      "Durée",
      interaction.duration_minutes == null
        ? null
        : `${interaction.duration_minutes} min`,
    ],
    ["Résultat", interaction.result],
    ["Score d'intérêt", `${interaction.interest_score}/10`],
  ];

  const visibleDetails = details.filter(
    ([, value]) => value !== null && value !== "",
  );
  if (!visibleDetails.length) return null;

  return (
    <dl className="mt-3 grid gap-3 rounded-lg bg-muted p-3 text-sm sm:grid-cols-2">
      {visibleDetails.map(([label, value]) => (
        <div key={label}>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </dt>
          <dd className="mt-0.5 font-medium text-foreground">{value}</dd>
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
  numeric,
}: {
  icon: typeof Phone;
  label: string;
  value?: string | null;
  link?: boolean;
  numeric?: boolean;
}) {
  const display = value || "—";
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Icon
          className="size-3.5 shrink-0 text-subtle-foreground"
          aria-hidden="true"
        />
        {label}
      </dt>
      <dd className="mt-1 font-medium break-words">
        {link && value ? (
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline-offset-4 hover:underline"
          >
            {display}
          </a>
        ) : (
          <span className={numeric ? "tabular" : undefined}>{display}</span>
        )}
      </dd>
    </div>
  );
}
