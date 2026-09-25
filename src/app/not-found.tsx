import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <div className="text-center">
        <p className="text-7xl font-semibold text-blue-600">404</p>
        <h1 className="mt-4 text-2xl font-semibold">Page introuvable</h1>
        <p className="mt-2 text-slate-500">
          La ressource demandée n’existe pas ou n’est pas accessible.
        </p>
        <Button render={<Link href="/dashboard" />} className="mt-6">
          Retour au tableau de bord
        </Button>
      </div>
    </main>
  );
}
