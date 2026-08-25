import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions légales · Savoury",
};

export default function MentionsLegalesPage() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-6 text-center">
        <span className="font-display text-2xl font-bold tracking-tight">Mentions légales</span>
      </div>

      <div className="space-y-6 text-sm leading-relaxed text-foreground">
        <section>
          <h2 className="mb-2 font-display text-lg font-semibold">Éditeur</h2>
          <p>Le site Savoury est édité par :</p>
          <ul className="list-inside list-disc space-y-1">
            <li>Nom de l&apos;éditeur : [À compléter — nom de la société ou de la personne]</li>
            <li>Forme juridique et capital : [À compléter]</li>
            <li>Siège social : [À compléter]</li>
            <li>Numéro SIREN : [À compléter]</li>
            <li>Directeur de la publication : [À compléter]</li>
            <li>Contact : voir la page <a href="/contact" className="font-semibold text-primary hover:underline">Contact</a></li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg font-semibold">Hébergement</h2>
          <p>Le site est hébergé par :</p>
          <ul className="list-inside list-disc space-y-1">
            <li>Render Inc.</li>
            <li>Site web : <a href="https://render.com" className="font-semibold text-primary hover:underline">https://render.com</a></li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg font-semibold">Propriété intellectuelle</h2>
          <p>
            Les marques, logos et éléments graphiques de Savoury ainsi que la structure du site sont
            protégés. Les recettes et photos publiées par les utilisateurs restent la propriété de leurs
            auteurs, conformément aux <a href="/cgu" className="font-semibold text-primary hover:underline">conditions générales d&apos;utilisation</a>.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg font-semibold">Protection des données</h2>
          <p>
            Les traitements de données personnelles réalisés par le site sont décrits dans la page{" "}
            <a href="/privacy" className="font-semibold text-primary hover:underline">Confidentialité</a>.
            Vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression de vos données.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg font-semibold">Cookies</h2>
          <p>
            L&apos;utilisation de cookies est décrite dans la page{" "}
            <a href="/privacy" className="font-semibold text-primary hover:underline">Confidentialité</a>.
            Vous pouvez gérer vos préférences à tout moment via la bannière de consentement.
          </p>
        </section>
      </div>
    </div>
  );
}