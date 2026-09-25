"use client";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
export default function ErrorPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="grid size-14 place-items-center rounded-full bg-red-50 text-red-600">
        <AlertTriangle />
      </span>
      <h2 className="mt-4 text-xl font-semibold">Une erreur est survenue</h2>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        Rechargez la page pour récupérer la dernière version de l’application,
        puis réessayez. Les informations non enregistrées devront être saisies à
        nouveau.
      </p>
      <Button className="mt-5" onClick={() => window.location.reload()}>
        Recharger la page
      </Button>
    </div>
  );
}
