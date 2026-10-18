"use client";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
export default function ErrorPage() {
  return (
    <div
      role="alert"
      className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center"
    >
      <span className="grid size-14 place-items-center rounded-full bg-destructive-muted text-destructive ring-8 ring-destructive-muted/50">
        <AlertTriangle className="size-6" aria-hidden="true" />
      </span>
      <h2 className="mt-6 text-xl font-bold tracking-tight text-foreground">
        Une erreur est survenue
      </h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        Rechargez la page pour récupérer la dernière version de l’application,
        puis réessayez. Les informations non enregistrées devront être saisies à
        nouveau.
      </p>
      <Button className="mt-6" onClick={() => window.location.reload()}>
        <RotateCw aria-hidden="true" />
        Recharger la page
      </Button>
    </div>
  );
}
