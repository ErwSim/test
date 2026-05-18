"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[error-boundary]", error.digest ?? "", error.message);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-medium text-[var(--color-danger)]">Erreur</p>
      <h1 className="mt-2 text-3xl font-bold">Quelque chose a mal tourné</h1>
      <p className="mt-3 text-[var(--color-muted-foreground)]">
        Une erreur inattendue s'est produite. Réessayez ou revenez à l'accueil.
      </p>
      {error.digest ? (
        <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">
          Code technique&nbsp;: <code>{error.digest}</code>
        </p>
      ) : null}
      <div className="mt-8 flex gap-3">
        <Button onClick={reset}>Réessayer</Button>
        <a href="/">
          <Button variant="secondary">Accueil</Button>
        </a>
      </div>
    </main>
  );
}
