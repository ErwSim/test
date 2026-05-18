import Link from "next/link";
import GeneratorClient from "./GeneratorClient";

export const metadata = {
  title: "Générer une annonce",
  description: "Renseignez le bien, recevez 5 versions conformes en 10 secondes.",
};

export default function GeneratePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-sm text-[var(--color-muted-foreground)] hover:underline">
          ← Annoncia
        </Link>
        <Link
          href="/pricing"
          className="text-sm text-[var(--color-muted-foreground)] hover:underline"
        >
          Tarifs
        </Link>
      </div>
      <h1 className="text-3xl font-bold">Nouvelle annonce</h1>
      <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
        Renseignez les données du mandat. Tout ce qui n'est pas indiqué ne sera pas inventé.
      </p>
      <div className="mt-8">
        <GeneratorClient />
      </div>
    </main>
  );
}
