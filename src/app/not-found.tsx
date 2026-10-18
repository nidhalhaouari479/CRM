import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-background p-6">
      <div className="flex max-w-md flex-col items-center text-center">
        <span className="grid size-14 place-items-center rounded-full bg-accent text-primary ring-8 ring-accent/50">
          <Compass className="size-6" aria-hidden="true" />
        </span>
        <p className="tabular mt-6 text-sm font-semibold uppercase tracking-wide text-primary">
          Erreur 404
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
          Page introuvable
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          La ressource demandée n’existe pas ou n’est pas accessible.
        </p>
        <Button
          render={<Link href="/dashboard" />}
          nativeButton={false}
          className="mt-6"
        >
          <ArrowLeft aria-hidden="true" />
          Retour au tableau de bord
        </Button>
      </div>
    </main>
  );
}
