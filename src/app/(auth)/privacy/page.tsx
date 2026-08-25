import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Confidentialité · Savoury",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-6 text-center">
        <span className="font-display text-2xl font-bold tracking-tight">Confidentialité</span>
      </div>

      <div className="prose-sm space-y-6 text-sm leading-relaxed text-foreground">
        <section>
          <h2 className="mb-2 font-display text-lg font-semibold">Responsable du traitement</h2>
          <p>
            Savoury est un projet de démonstration. L&apos;éditeur est responsable du traitement des
            données personnelles réalisé par l&apos;application.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg font-semibold">Données collectées</h2>
          <p>Les seules données collectées sont celles strictement nécessaires au fonctionnement du service :</p>
          <ul className="list-inside list-disc space-y-1">
            <li>pseudo, adresse e-mail et mot de passe chiffré (compte) ;</li>
            <li>contenu publié : recettes, commentaires, messages privés ;</li>
            <li>interactions : abonnements, « j&apos;aime » ;</li>
            <li>image de profil et photos de recettes stockées dans notre hébergement.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg font-semibold">Base légale</h2>
          <p>
            Les traitements reposent sur l&apos;exécution du contrat (fourniture du service), votre
            consentement lors de la création du compte, et l&apos;intérêt légitime de Savoury à lutter
            contre les contenus abusifs (modération des signalements et des messages privés).
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg font-semibold">Modération et messages privés</h2>
          <p>
            Pour prévenir le harcèlement et les contenus illicites, un administrateur peut consulter
            <strong> uniquement le message signalé</strong>, jamais l&apos;intégralité d&apos;une
            conversation. Aucune copie du contenu n&apos;est conservée : seuls le signalement et les
            métadonnées (auteur, date) sont gardés. Les messages supprimés sont effacés définitivement.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg font-semibold">Cookies et mesure d&apos;audience</h2>
          <p>
            Un cookie <strong>strictement nécessaire</strong> est déposé pour maintenir votre session de
            connexion. Des cookies de <strong>mesure d&apos;audience et de publicité</strong> (Google
            Analytics, Google Ads) ne sont déposés qu&apos;avec votre consentement, recueilli via la
            bannière de consentement. Nous utilisons le <strong>Consent Mode v2</strong> : aucun cookie
            publicitaire n&apos;est lu ou écrit avant votre choix. Vous pouvez retirer votre consentement
            à tout moment en effaçant vos cookies ou via la bannière.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg font-semibold">Savoury AI</h2>
          <p>
            La fonctionnalité Savoury AI s&apos;appuie sur un modèle d&apos;intelligence
            artificielle fourni via NVIDIA NIM. Le texte de tes demandes (prompts) et les recettes
            générées non publiées sont conservés <strong>30 jours maximum</strong>, puis supprimés
            automatiquement. Elles disparaissent immédiatement si tu publies la recette ou supprimes
            ton compte.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg font-semibold">Durée de conservation</h2>
          <p>
            Les données du compte sont conservées tant que le compte existe. Les signalements sont
            conservés <strong>12 mois</strong> maximum, puis supprimés automatiquement.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg font-semibold">Vos droits</h2>
          <p>
            Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification, de
            portabilité et d&apos;opposition. Vous pouvez exporter vos             données (profil, recettes,
            commentaires, messages) sous forme d&apos;archive CSV depuis le menu de votre compte
            (« Télécharger mes
            données »). Vous pouvez demander l&apos;effacement de vos données à tout moment depuis ce
            même menu (« Supprimer mon compte »), ce qui entraîne la suppression définitive de votre
            profil, de vos recettes, commentaires et messages.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg font-semibold">Contact</h2>
          <p>
            Pour toute demande, écrivez à l&apos;adresse indiquée dans le README du projet.
          </p>
        </section>
      </div>
    </div>
  );
}