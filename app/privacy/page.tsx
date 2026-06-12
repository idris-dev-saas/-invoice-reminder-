import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  robots: { index: true, follow: true },
}

export default function PrivacyPage() {
  const updated = '12 juin 2026'
  return (
    <div className="legal-page">
      <div className="legal-wrap">
        <Link href="/" className="legal-back">← Retour</Link>

        <h1 className="legal-title">Politique de confidentialité</h1>
        <p className="legal-updated">Dernière mise à jour : {updated}</p>

        <section className="legal-section">
          <h2>1. Responsable du traitement</h2>
          <p>
            Invoice Reminder est responsable du traitement de vos données personnelles dans
            le cadre de l'utilisation de la plateforme accessible à l'adresse invoice-reminder.app.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Données collectées</h2>
          <p>Nous collectons uniquement les données nécessaires au fonctionnement du service :</p>
          <ul>
            <li><strong>Compte</strong> : adresse email, nom, mot de passe (haché).</li>
            <li><strong>Factures</strong> : nom du client, email du client, montant, devise, date d'échéance.</li>
            <li><strong>Paiement</strong> : informations de facturation traitées par Stripe (nous n'accédons pas aux données de carte bancaire).</li>
            <li><strong>Technique</strong> : logs d'activité à des fins de sécurité et de débogage.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>3. Finalités du traitement</h2>
          <ul>
            <li>Fournir le service de gestion et de relance de factures.</li>
            <li>Envoyer les emails de relance à vos clients en votre nom.</li>
            <li>Gérer votre abonnement et les paiements.</li>
            <li>Assurer la sécurité et prévenir les abus.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>4. Base légale</h2>
          <p>
            Le traitement est fondé sur l'exécution du contrat (fourniture du service) et,
            pour les communications marketing éventuelles, sur votre consentement.
          </p>
        </section>

        <section className="legal-section">
          <h2>5. Conservation des données</h2>
          <p>
            Vos données sont conservées pendant toute la durée de votre compte actif,
            puis supprimées dans un délai de 30 jours après la fermeture du compte,
            sauf obligation légale contraire.
          </p>
        </section>

        <section className="legal-section">
          <h2>6. Partage des données</h2>
          <p>Nous ne vendons jamais vos données. Nous faisons appel à des sous-traitants techniques :</p>
          <ul>
            <li><strong>Resend</strong> — envoi des emails de relance.</li>
            <li><strong>Stripe</strong> — traitement des paiements.</li>
            <li><strong>Supabase / hébergeur</strong> — stockage des données.</li>
          </ul>
          <p>Ces sous-traitants sont contractuellement tenus de protéger vos données.</p>
        </section>

        <section className="legal-section">
          <h2>7. Vos droits</h2>
          <p>Conformément au RGPD, vous disposez des droits suivants :</p>
          <ul>
            <li>Accès, rectification et effacement de vos données.</li>
            <li>Portabilité de vos données.</li>
            <li>Opposition et limitation du traitement.</li>
          </ul>
          <p>
            Pour exercer ces droits, contactez-nous à l'adresse :{' '}
            <a href="mailto:privacy@invoice-reminder.app">privacy@invoice-reminder.app</a>
          </p>
        </section>

        <section className="legal-section">
          <h2>8. Sécurité</h2>
          <p>
            Nous appliquons des mesures de sécurité techniques et organisationnelles :
            chiffrement des mots de passe (bcrypt), communications HTTPS,
            isolation des données par compte, rate limiting.
          </p>
        </section>

        <section className="legal-section">
          <h2>9. Cookies</h2>
          <p>
            Invoice Reminder utilise uniquement un cookie de session nécessaire à l'authentification.
            Aucun cookie publicitaire ou de tracking tiers n'est utilisé.
          </p>
        </section>
      </div>
    </div>
  )
}
