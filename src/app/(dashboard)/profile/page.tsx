import type { ReactNode } from "react";
import {
  Clock3,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { updateProfile } from "@/app/(dashboard)/actions";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatDuration, initials } from "@/lib/format";
import type { LoginSession } from "@/lib/types";
import { EmptyState } from "@/components/empty-state";
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
      <div className="grid gap-6 lg:grid-cols-[.65fr_1.35fr]">
        <Card>
          <CardContent className="flex flex-col items-center px-6 pt-4 pb-2 text-center">
            <Avatar className="size-24 ring-4 ring-accent">
              <AvatarImage src={profile.avatar_url ?? undefined} />
              <AvatarFallback className="bg-accent text-2xl font-semibold text-accent-foreground">
                {initials(profile.first_name, profile.last_name)}
              </AvatarFallback>
            </Avatar>
            <h2 className="mt-4 text-xl font-bold tracking-tight">
              {profile.first_name} {profile.last_name}
            </h2>
            <p className="mt-2 inline-flex items-center rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
              {profile.role === "admin" ? "Administrateur" : "Employé"}
            </p>
            <dl className="mt-6 grid w-full gap-4 border-t pt-6 text-left text-sm">
              <ProfileFact icon={Mail} label="Courriel">
                <span className="break-all">{profile.email}</span>
              </ProfileFact>
              <ProfileFact icon={Phone} label="Téléphone">
                {profile.phone ? (
                  <span className="tabular">{profile.phone}</span>
                ) : (
                  <span className="text-muted-foreground">Non renseigné</span>
                )}
              </ProfileFact>
              <ProfileFact icon={ShieldCheck} label="Statut">
                <span
                  className={
                    profile.is_active ? "text-success" : "text-destructive"
                  }
                >
                  Compte {profile.is_active ? "actif" : "désactivé"}
                </span>
              </ProfileFact>
              <ProfileFact icon={UserRound} label="Membre depuis">
                <time dateTime={profile.created_at}>
                  {formatDate(profile.created_at)}
                </time>
              </ProfileFact>
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Informations personnelles</CardTitle>
            <CardDescription>
              Le courriel et le rôle sont gérés par un administrateur.
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
              <div className="flex justify-end border-t pt-5">
                <Button type="submit">Enregistrer</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      <Card className="gap-0 pb-0">
        <CardHeader className="border-b">
          <CardTitle>Historique de connexion</CardTitle>
          <CardDescription>
            Date, heure et durée de vos connexions.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {sessions.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Connexion</TableHead>
                  <TableHead>Déconnexion</TableHead>
                  <TableHead className="text-right">Durée</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      <span className="flex items-center gap-2 font-medium">
                        <Clock3
                          className="size-4 text-subtle-foreground"
                          aria-hidden="true"
                        />
                        <time dateTime={session.login_at}>
                          {formatDate(session.login_at, true)}
                        </time>
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {session.logout_at ? (
                        <time dateTime={session.logout_at}>
                          {formatDate(session.logout_at, true)}
                        </time>
                      ) : (
                        formatDate(session.logout_at, true)
                      )}
                    </TableCell>
                    <TableCell className="tabular text-right font-medium">
                      {formatDuration(session.duration_seconds)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-5">
              <EmptyState
                icon={Clock3}
                title="Aucune connexion"
                description="Aucun historique de connexion."
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileFact({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-subtle-foreground">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </dt>
        <dd className="mt-0.5 font-medium">{children}</dd>
      </div>
    </div>
  );
}
