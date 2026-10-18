import { frenchLabel } from "@/lib/labels";
import Link from "next/link";
import { MessageSquareText, Search, SlidersHorizontal } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import type { Interaction } from "@/lib/types";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/empty-state";
import { EntityAvatar } from "@/components/entity-avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/forms/form-fields";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Interactions" };

const interactionTypes = [
  "Message",
  "Email",
  "Telephone",
  "Meeting en ligne",
  "Meeting face a face",
];

export default async function InteractionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  await requireProfile();
  const params = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase
    .from("interactions")
    .select(
      "*, clients(company_name, contact_name), profiles(first_name, last_name)",
    )
    .order("date", { ascending: false });
  const interactions = (data ?? []) as unknown as Interaction[];
  const q = (params.q ?? "").toLowerCase();
  const rows = interactions.filter(
    (item) =>
      (!q ||
        `${item.objective} ${item.result} ${item.conclusion} ${item.clients?.company_name ?? ""}`
          .toLowerCase()
          .includes(q)) &&
      (!params.type || item.type === params.type),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Interactions"
        description="Historique des messages, emails, telephones et meetings."
      />
      <Card className="gap-0 py-0">
        <form
          role="search"
          aria-label="Filtrer les interactions"
          className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center"
        >
          <div className="relative flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle-foreground"
            />
            <Input
              name="q"
              type="search"
              aria-label="Rechercher une interaction"
              defaultValue={params.q}
              className="pl-9"
              placeholder="Client, objectif, resultat ou conclusion"
            />
          </div>
          <NativeSelect
            name="type"
            aria-label="Type d'interaction"
            defaultValue={params.type}
            className="md:w-48"
          >
            <option value="">Tous les types</option>
            {interactionTypes.map((v) => (
              <option key={v} value={v}>
                {frenchLabel(v)}
              </option>
            ))}
          </NativeSelect>
          <Button variant="outline">
            <SlidersHorizontal aria-hidden="true" />
            Filtrer
          </Button>
        </form>
        {rows.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Employe</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Duree</TableHead>
                <TableHead>Objectif</TableHead>
                <TableHead>Résultat</TableHead>
                <TableHead>Conclusion</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead>Prochaine action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((item) => {
                const clientName =
                  item.clients?.company_name ?? item.clients?.contact_name;
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <EntityAvatar name={clientName} />
                        <Link
                          href={`/clients/${item.client_id}`}
                          className="font-semibold text-foreground underline-offset-4 hover:text-primary hover:underline"
                        >
                          {clientName}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className="tabular whitespace-nowrap text-muted-foreground">
                      <time dateTime={item.date}>
                        {formatDate(item.date, true)}
                      </time>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.profiles
                        ? `${item.profiles.first_name} ${item.profiles.last_name}`
                        : "—"}
                    </TableCell>
                    <TableCell>{frenchLabel(item.type)}</TableCell>
                    <TableCell className="tabular text-right text-muted-foreground">
                      {item.duration_minutes != null
                        ? `${item.duration_minutes} min`
                        : "—"}
                    </TableCell>
                    <TableCell className="max-w-xs truncate font-medium">
                      {item.objective}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {item.result}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {item.conclusion || "—"}
                    </TableCell>
                    <TableCell className="tabular text-right font-semibold">
                      {item.interest_score}
                      <span className="font-normal text-subtle-foreground">
                        /10
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.next_action ?? "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="p-5">
            <EmptyState
              icon={MessageSquareText}
              title="Aucune interaction"
              description="Les interactions sont ajoutees depuis la fiche d'un client."
            />
          </div>
        )}
      </Card>
    </div>
  );
}
