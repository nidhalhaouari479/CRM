import { Building2, CheckCircle2, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { signIn } from "@/app/(auth)/actions";
import { getCurrentProfile } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { LoginSubmitButton } from "@/components/forms/login-submit-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata = { title: "Connexion" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (profile) redirect("/dashboard");
  const { error } = await searchParams;
  const configured = isSupabaseConfigured();

  return (
    <main className="grid min-h-screen bg-slate-950 lg:grid-cols-[1.1fr_.9fr]">
      <section className="relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,.35),transparent_35%),radial-gradient(circle_at_80%_70%,rgba(99,102,241,.25),transparent_35%)]" />
        <div className="relative flex items-center gap-3 text-lg font-semibold">
          <span className="grid size-10 place-items-center rounded-xl bg-blue-500">
            <Building2 className="size-5" />
          </span>
          Gestion clients Tunisie
        </div>
        <div className="relative max-w-xl">
          <p className="mb-4 text-sm font-medium uppercase tracking-[.22em] text-blue-300">
            Espace de travail interne
          </p>
          <h1 className="text-5xl font-semibold leading-tight tracking-tight">
            Pilotez vos clients, projets et revenus au même endroit.
          </h1>
          <div className="mt-8 grid gap-4 text-slate-300 sm:grid-cols-2">
            <p className="flex gap-2">
              <CheckCircle2 className="mt-0.5 size-5 text-emerald-400" /> Suivi
              commercial complet
            </p>
            <p className="flex gap-2">
              <ShieldCheck className="mt-0.5 size-5 text-emerald-400" /> Données
              protégées par des droits d’accès
            </p>
          </div>
        </div>
        <p className="relative text-sm text-slate-400">
          Accès réservé aux collaborateurs autorisés.
        </p>
      </section>

      <section className="flex items-center justify-center bg-slate-50 p-6 sm:p-10">
        <Card className="w-full max-w-md border-slate-200 shadow-xl shadow-slate-950/5">
          <CardHeader className="space-y-2 pb-6">
            <div className="mb-4 grid size-11 place-items-center rounded-xl bg-blue-600 text-white lg:hidden">
              <Building2 className="size-5" />
            </div>
            <CardTitle className="text-2xl">Bon retour</CardTitle>
            <CardDescription>
              Connectez-vous à votre espace de gestion sécurisé.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!configured && (
              <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                Supabase n’est pas configuré. Copiez <code>.env.example</code>{" "}
                vers <code>.env.local</code> puis ajoutez vos clés.
              </div>
            )}
            {error && (
              <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <form action={signIn} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Adresse courriel</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="vous@entreprise.tn"
                  required
                  disabled={!configured}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  minLength={6}
                  required
                  disabled={!configured}
                />
              </div>
              <LoginSubmitButton disabled={!configured} />
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
