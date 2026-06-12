import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation",
  robots: { index: true, follow: true },
}

export default function TermsPage() {
  const updated = '12 juin 2026'
  return (
    <div className="legal-page">
      <div className="legal-wrap">
        <Link href="/" className="legal-back">← Retour</Link>

        <h1 className="legal-title">Conditions générales d'utilisation</h1>
        <p className="legal-updated">Dernière mise à jour : {updated}</p>

        <section className="legal-section">
          <h2>1. Objet</h2>
          <p>
            Les présentes CGU définissent les conditions d'accès et d'utilisation de la
            plateforme Invoice Reminder, service en ligne de gestion et de relance de factures.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Acceptation</h2>
          <p>
            L'utilisation du service implique l'acceptation pleine et entière des présentes CGU.
            Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser le service.
          </p>
        </section>

        <section className="legal-section">
          <h2>3. Description du service</h2>
          <p>Invoice Reminder est un outil permettant de :</p>
          <ul>
            <li>Créer et gérer des factures clients.</li>
            <li>Envoyer automatiquement des rappels par email aux clients en retard de paiement.</li>
            <li>Suivre le statut des paiements et le taux de recouvrement.</li>
            <li>Exporter les factures en PDF (plans payants).</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>4. Compte utilisateur</h2>
          <p>
            L'accès au service nécessite la création d'un compte avec une adresse email valide.
            Vous êtes responsable de la confidentialité de vos identifiants et de toutes les
            actions effectuées depuis votre compte.
          </p>
        </section>

        <section className="legal-section">
          <h2>5. Plans et facturation</h2>
          <p>
            Le service est proposé en version gratuite (5 factures) et en plans payants (Pro à 12€/mois,
            Business à 29€/mois). Les abonnements sont mensuels, sans engagement, résiliables à tout moment.
            Le remboursement des périodes entamées n'est pas proposé sauf obligation légale.
          </p>
        </section>

        <section className="legal-section">
          <h2>6. Utilisation acceptable</h2>
          <p>Vous vous engagez à ne pas utiliser le service pour :</p>
          <ul>
            <li>Envoyer des communications non sollicitées (spam) à des tiers.</li>
            <li>Toute activité illégale ou frauduleuse.</li>
            <li>Tenter de compromettre la sécurité de la plateforme.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>7. Responsabilité</h2>
          <p>
            Invoice Reminder est un outil de relance automatisée. La responsabilité de la
            relation commerciale avec vos clients demeure entièrement la vôtre.
            Nous ne saurions être tenus responsables des conséquences des relances envoyées
            ni du non-paiement de vos factures.
          </p>
          <p>
            Le service est fourni "tel quel". Nous nous efforçons de maintenir une disponibilité
            optimale mais ne garantissons pas un service ininterrompu.
          </p>
        </section>

        <section className="legal-section">
          <h2>8. Résiliation</h2>
          <p>
            Vous pouvez fermer votre compte à tout moment depuis les paramètres. En cas de
            violation des présentes CGU, nous nous réservons le droit de suspendre ou
            supprimer votre compte sans préavis.
          </p>
        </section>

        <section className="legal-section">
          <h2>9. Modifications</h2>
          <p>
            Nous nous réservons le droit de modifier les présentes CGU. En cas de modification
            substantielle, vous serez informé par email au moins 15 jours avant l'entrée en vigueur.
          </p>
        </section>

        <section className="legal-section">
          <h2>10. Droit applicable</h2>
          <p>
            Les présentes CGU sont soumises au droit français.
            Tout litige relève de la compétence des tribunaux français.
          </p>
        </section>
      </div>
    </div>
  )
}
