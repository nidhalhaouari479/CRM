import { frenchLabel } from "@/lib/labels";
import Link from "next/link";
import { MessageSquareText, Search } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import type { Interaction } from "@/lib/types";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
      <Card>
        <CardContent className="p-4">
          <form className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                name="q"
                defaultValue={params.q}
                className="pl-9"
                placeholder="Client, objectif, resultat ou conclusion"
              />
            </div>
            <NativeSelect
              name="type"
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
            <Button variant="outline">Filtrer</Button>
          </form>
        </CardContent>
      </Card>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {rows.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Employe</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Duree</TableHead>
                  <TableHead>Objectif</TableHead>
                  <TableHead>Résultat</TableHead>
                  <TableHead>Conclusion</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Prochaine action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{formatDate(item.date, true)}</TableCell>
                    <TableCell>
                      {item.profiles
                        ? `${item.profiles.first_name} ${item.profiles.last_name}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/clients/${item.client_id}`}
                        className="font-medium hover:text-blue-600"
                      >
                        {item.clients?.company_name ??
                          item.clients?.contact_name}
                      </Link>
                    </TableCell>
                    <TableCell>{frenchLabel(item.type)}</TableCell>
                    <TableCell>
                      {item.duration_minutes != null
                        ? `${item.duration_minutes} min`
                        : "—"}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {item.objective}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-xs text-slate-600">
                      {item.result}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-xs text-slate-600">
                      {item.conclusion || "—"}
                    </TableCell>
                    <TableCell>{item.interest_score}/10</TableCell>
                    <TableCell>{item.next_action ?? "—"}</TableCell>
                  </TableRow>
                ))}
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
        </CardContent>
      </Card>
    </div>
  );
}
