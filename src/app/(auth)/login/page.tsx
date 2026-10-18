import {
  AlertTriangle,
  BarChart3,
  Building2,
  ShieldCheck,
  Users,
} from "lucide-react";
import { redirect } from "next/navigation";
import { signIn } from "@/app/(auth)/actions";
import { getCurrentProfile } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { LoginSubmitButton } from "@/components/forms/login-submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata = { title: "Connexion" };

const highlights = [
  {
    icon: Users,
    title: "Suivi commercial complet",
    text: "Clients, projets, tâches et interactions au même endroit.",
  },
  {
    icon: BarChart3,
    title: "Revenus transparents",
    text: "Paiements, commissions et bonus calculés automatiquement.",
  },
  {
    icon: ShieldCheck,
    title: "Accès sécurisé",
    text: "Chaque collaborateur ne voit que ce qui le concerne.",
  },
];

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
    <main className="grid min-h-dvh bg-background lg:grid-cols-[1fr_1fr] xl:grid-cols-[1.1fr_.9fr]">
      <section className="relative hidden overflow-hidden bg-sidebar p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(to_right,rgb(255_255_255/0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.04)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_top_left,black_30%,transparent_75%)]"
        />
        <div className="relative flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Building2 className="size-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block font-semibold leading-tight">
              Gestion clients
            </span>
            <span className="block text-xs text-sidebar-muted">
              Tunisie · CRM
            </span>
          </span>
        </div>

        <div className="relative max-w-xl">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[.2em] text-sidebar-primary">
            Espace de travail interne
          </p>
          <h1 className="text-4xl font-bold leading-[1.15] tracking-tight xl:text-5xl">
            Pilotez vos clients, projets et revenus au même endroit.
          </h1>
          <ul className="mt-10 space-y-5">
            {highlights.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white/[.06] ring-1 ring-white/10">
                  <Icon
                    className="size-5 text-sidebar-primary"
                    aria-hidden="true"
                  />
                </span>
                <span>
                  <span className="block font-semibold">{title}</span>
                  <span className="mt-0.5 block text-sm text-sidebar-foreground">
                    {text}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-sidebar-muted">
          Accès réservé aux collaborateurs autorisés.
        </p>
      </section>

      <section className="flex items-center justify-center px-4 py-10 sm:px-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="grid size-10 place-items-center rounded-lg bg-sidebar text-sidebar-primary">
              <Building2 className="size-5" aria-hidden="true" />
            </span>
            <span className="font-semibold">Gestion clients Tunisie</span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight">Bon retour</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Connectez-vous à votre espace de gestion sécurisé.
          </p>

          {!configured && (
            <div
              role="status"
              className="mt-6 flex gap-3 rounded-lg border border-warning/30 bg-warning-muted p-3 text-sm text-warning"
            >
              <AlertTriangle
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              <p>
                Supabase n’est pas configuré. Copiez <code>.env.example</code>{" "}
                vers <code>.env.local</code> puis ajoutez vos clés.
              </p>
            </div>
          )}
          {error && (
            <div
              role="alert"
              className="mt-6 flex gap-3 rounded-lg border border-destructive/30 bg-destructive-muted p-3 text-sm text-destructive"
            >
              <AlertTriangle
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              <p>{error}</p>
            </div>
          )}

          <form action={signIn} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Adresse courriel</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="vous@entreprise.tn"
                className="h-11"
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
                className="h-11"
                required
                disabled={!configured}
              />
            </div>
            <LoginSubmitButton disabled={!configured} />
          </form>
        </div>
      </section>
    </main>
  );
}
