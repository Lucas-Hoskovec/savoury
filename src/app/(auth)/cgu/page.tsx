import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation · Savoury",
};

export default function CguPage() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-6 text-center">
        <span className="font-display text-2xl font-bold tracking-tight">
          Conditions générales d&apos;utilisation
        </span>
        <p className="mt-1 text-sm text-muted-foreground">Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}</p>
      </div>

      <div className="space-y-6 text-sm leading-relaxed text-foreground">
        <section>
          <h2 className="mb-2 font-display text-lg font-semibold">1. Objet</h2>
          <p>
            Les présentes conditions encadrent l&apos;utilisation du service Savoury, un réseau
            social culinaire permettant de publier, partager et commenter des recettes. En créant un
            compte ou en utilisant le service, vous acceptez les présentes conditions.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg font-semibold">2. Contenus publiés</h2>
          <p>
            Vous restez propriétaire des contenus que vous publiez (recettes, photos, commentaires).
            En les publiant, vous nous accordez une licence non exclusive, mondiale et gratuite de les
            afficher et de les diffuser dans le cadre du service. Vous garantissez détenir tous les
            droits nécessaires sur ces contenus, notamment les droits d&apos;auteur sur les photos.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg font-semibold">3. Comportements et contenus interdits</h2>
          <p>Il est strictement interdit de publier ou de transmettre, notamment :</p>
          <ul className="list-inside list-disc space-y-1">
            <li>des contenus illégaux, incitant à la haine, au harcèlement ou à la violence ;</li>
            <li>des contenus à caractère sexuel ou pornographique, y compris des photos de recettes à connotation explicite ;</li>
            <li>des contenus liés à des produits réglementés ou dangereux (drogues illicites, armes, tabac, produits dopants) ;</li>
            <li>des contenus portant atteinte aux droits d&apos;auteur, aux marques ou à la vie privée de tiers ;</li>
            <li>de l&apos;usurpation d&apos;identité ou des informations trompeuses ;</li>
            <li>du spam, des messages en masse ou du contenu publicitaire non sollicité ;</li>
            <li>des contenus destinés à un public adulte ou nuisibles aux mineurs.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg font-semibold">4. Modération</h2>
          <p>
            Chaque utilisateur peut signaler un contenu inapproprié (recette, commentaire, message ou
            compte) via le bouton de signalement. Un administrateur examine les signalements et peut
            retirer tout contenu contraire aux présentes conditions, suspendre ou supprimer un compte
            sans préavis. Un filtre automatique bloque également certains contenus manifestement
            inappropriés.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg font-semibold">5. Messages privés</h2>
          <p>
            La messagerie privée est réservée aux abonnements mutuels. En cas de signalement d&apos;un
            message, l&apos;administrateur n&apos;a accès qu&apos;au message signalé, jamais à
            l&apos;intégralité de la conversation.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg font-semibold">6. Suspension et suppression du compte</h2>
          <p>
            Vous pouvez supprimer votre compte à tout moment depuis le menu de votre profil. Cette
            suppression est définitive et entraîne l&apos;effacement de vos données conformément à notre
            politique de confidentialité. Savoury peut suspendre un compte en cas de non-respect des
            présentes conditions.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg font-semibold">7. Responsabilité</h2>
          <p>
            Le service est fourni tel quel, sans garantie. Savoury ne saurait être tenu responsable des
            contenus publiés par les utilisateurs, ni des dommages indirects résultant de
            l&apos;utilisation du service. En cas de litige, le droit français s&apos;applique.
          </p>
        </section>
      </div>
    </div>
  );
}