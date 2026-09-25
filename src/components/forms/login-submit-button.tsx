"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function LoginSubmitButton({ disabled = false }: { disabled?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      className="w-full"
      size="lg"
      disabled={disabled || pending}
    >
      {pending ? (
        <>
          <LoaderCircle className="animate-spin" />
          Connexion...
        </>
      ) : (
        "Se connecter"
      )}
    </Button>
  );
}
