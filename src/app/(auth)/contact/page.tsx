import type { Metadata } from "next";
import { Mail } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact · Savoury",
};

const SUPPORT_EMAIL = "contact@savoury.app";

export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-xl text-center">
      <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Mail className="size-7" />
      </div>
      <h1 className="font-display text-2xl font-bold">Contact</h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        Une question, un signalement d&apos;abus non traité, une demande relative à vos données
        personnelles ? Écrivez-nous, nous répondons sous 48 h ouvrées.
      </p>

      <a
        href={`mailto:${SUPPORT_EMAIL}`}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        <Mail className="size-4" />
        {SUPPORT_EMAIL}
      </a>

      <p className="mt-6 text-xs text-muted-foreground">
        Pour signaler un contenu directement dans l&apos;app, utilisez le bouton{" "}
        <span className="font-semibold">signaler</span> sur la recette, le commentaire, le message ou
        le profil concerné. Consultez aussi les{" "}
        <Link href="/cgu" className="font-semibold text-primary hover:underline">CGU</Link> et les{" "}
        <Link href="/mentions-legales" className="font-semibold text-primary hover:underline">mentions légales</Link>.
      </p>
    </div>
  );
}