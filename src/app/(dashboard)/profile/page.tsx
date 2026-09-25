import { Clock3, Mail, Phone, ShieldCheck, UserRound } from "lucide-react";
import { updateProfile } from "@/app/(dashboard)/actions";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatDuration, initials } from "@/lib/format";
import type { LoginSession } from "@/lib/types";
import { PageHeader } from "@/components/layout/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

export const metadata = { title: "Mon profil" };
export default async function ProfilePage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: sessionsData } = await supabase
    .from("login_sessions")
    .select("*")
    .eq("profile_id", profile.id)
    .order("login_at", { ascending: false })
    .limit(10);
  const sessions = (sessionsData ?? []) as LoginSession[];
  return (
    <div className="space-y-6">
      <PageHeader
        title="Mon profil"
        description="Gérez vos informations personnelles."
      />
      <div className="grid gap-5 lg:grid-cols-[.65fr_1.35fr]">
        <Card>
          <CardContent className="flex flex-col items-center p-8 text-center">
            <Avatar className="size-24">
              <AvatarImage src={profile.avatar_url ?? undefined} />
              <AvatarFallback className="bg-blue-100 text-2xl font-semibold text-blue-700">
                {initials(profile.first_name, profile.last_name)}
              </AvatarFallback>
            </Avatar>
            <h2 className="mt-4 text-xl font-semibold">
              {profile.first_name} {profile.last_name}
            </h2>
            <p className="mt-1 text-sm capitalize text-slate-500">
              {profile.role === "admin" ? "Administrateur" : "Employé"}
            </p>
            <div className="mt-6 w-full space-y-3 border-t pt-6 text-left text-sm">
              <p className="flex items-center gap-3">
                <Mail className="size-4 text-slate-400" />
                {profile.email}
              </p>
              <p className="flex items-center gap-3">
                <Phone className="size-4 text-slate-400" />
                {profile.phone || "Non renseigné"}
              </p>
              <p className="flex items-center gap-3">
                <ShieldCheck className="size-4 text-emerald-500" />
                Compte {profile.is_active ? "actif" : "désactivé"}
              </p>
              <p className="flex items-center gap-3">
                <UserRound className="size-4 text-slate-400" />
                Depuis le {formatDate(profile.created_at)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
            <CardDescription>
              L’courriel et le rôle sont administrés par un administrateur.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateProfile} className="space-y-5">
              <FormGrid>
                <Field label="Prénom" htmlFor="first_name" required>
                  <Input
                    id="first_name"
                    name="first_name"
                    defaultValue={profile.first_name}
                    required
                  />
                </Field>
                <Field label="Nom" htmlFor="last_name" required>
                  <Input
                    id="last_name"
                    name="last_name"
                    defaultValue={profile.last_name}
                    required
                  />
                </Field>
              </FormGrid>
              <Field label="Courriel" htmlFor="email">
                <Input id="email" value={profile.email} disabled />
              </Field>
              <Field label="Téléphone" htmlFor="phone">
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={profile.phone ?? ""}
                />
              </Field>
              <Field label="URL de l’avatar" htmlFor="avatar_url">
                <Input
                  id="avatar_url"
                  name="avatar_url"
                  type="url"
                  defaultValue={profile.avatar_url ?? ""}
                />
              </Field>
              <Button type="submit">Enregistrer</Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Historique de connexion</CardTitle>
          <CardDescription>Date, heure et duree de vos connexions.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Connexion</TableHead>
                <TableHead>Deconnexion</TableHead>
                <TableHead>Duree</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>
                    <Clock3 className="mr-2 inline size-4 text-slate-400" />
                    {formatDate(session.login_at, true)}
                  </TableCell>
                  <TableCell>{formatDate(session.logout_at, true)}</TableCell>
                  <TableCell className="font-medium">
                    {formatDuration(session.duration_seconds)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!sessions.length && (
            <p className="p-10 text-center text-sm text-slate-500">
              Aucun historique de connexion.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
