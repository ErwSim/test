import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-muted)] py-10">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 text-sm md:grid-cols-4">
        <div>
          <p className="font-semibold">Annoncia</p>
          <p className="mt-2 text-[var(--color-muted-foreground)]">
            Annonces immobilières IA, conformes à la législation française.
          </p>
        </div>
        <div>
          <p className="font-semibold">Produit</p>
          <ul className="mt-2 space-y-1 text-[var(--color-muted-foreground)]">
            <li>
              <Link href="/generate" className="hover:underline">
                Générer une annonce
              </Link>
            </li>
            <li>
              <Link href="/pricing" className="hover:underline">
                Tarifs
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="hover:underline">
                Tableau de bord
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-semibold">Légal</p>
          <ul className="mt-2 space-y-1 text-[var(--color-muted-foreground)]">
            <li>
              <Link href="/legal/mentions-legales" className="hover:underline">
                Mentions légales
              </Link>
            </li>
            <li>
              <Link href="/legal/cgu" className="hover:underline">
                CGU
              </Link>
            </li>
            <li>
              <Link href="/legal/cgv" className="hover:underline">
                CGV
              </Link>
            </li>
            <li>
              <Link href="/legal/confidentialite" className="hover:underline">
                Confidentialité
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-semibold">Contact</p>
          <ul className="mt-2 space-y-1 text-[var(--color-muted-foreground)]">
            <li>
              <a href="mailto:contact@annoncia.fr" className="hover:underline">
                contact@annoncia.fr
              </a>
            </li>
            <li>
              <a href="mailto:dpo@annoncia.fr" className="hover:underline">
                dpo@annoncia.fr (RGPD)
              </a>
            </li>
          </ul>
        </div>
      </div>
      <p className="mx-auto mt-8 max-w-6xl px-6 text-xs text-[var(--color-muted-foreground)]">
        © {new Date().getFullYear()} Annoncia. Tous droits réservés.
      </p>
    </footer>
  );
}
