import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-medium text-[var(--color-muted-foreground)]">404</p>
      <h1 className="mt-2 text-3xl font-bold">Page introuvable</h1>
      <p className="mt-3 text-[var(--color-muted-foreground)]">
        Cette page n'existe pas ou plus. Reprenez à l'accueil ou directement au générateur.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/">
          <Button variant="secondary">Accueil</Button>
        </Link>
        <Link href="/generate">
          <Button>Générer une annonce</Button>
        </Link>
      </div>
    </main>
  );
}
