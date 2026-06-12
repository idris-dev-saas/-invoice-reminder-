import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Mentions légales',
  robots: { index: true, follow: true },
}

export default function LegalPage() {
  return (
    <div className="legal-page">
      <div className="legal-wrap">
        <Link href="/" className="legal-back">← Retour</Link>

        <h1 className="legal-title">Mentions légales</h1>

        <section className="legal-section">
          <h2>Éditeur du site</h2>
          <p>
            Invoice Reminder<br />
            Site : <a href="https://invoice-reminder.app">invoice-reminder.app</a><br />
            Contact : <a href="mailto:contact@invoice-reminder.app">contact@invoice-reminder.app</a>
          </p>
        </section>

        <section className="legal-section">
          <h2>Hébergement</h2>
          <p>
            Le site est hébergé sur l'infrastructure Vercel (Vercel Inc., 440 N Barranca Ave #4133,
            Covina, CA 91723, États-Unis) et utilise une base de données PostgreSQL hébergée
            en Europe (Supabase).
          </p>
        </section>

        <section className="legal-section">
          <h2>Propriété intellectuelle</h2>
          <p>
            L'ensemble des contenus présents sur ce site (textes, logo, interface) sont la
            propriété exclusive d'Invoice Reminder. Toute reproduction sans autorisation
            est interdite.
          </p>
        </section>

        <section className="legal-section">
          <h2>Données personnelles</h2>
          <p>
            Pour toute question relative au traitement de vos données personnelles,
            consultez notre <Link href="/privacy">Politique de confidentialité</Link>.
          </p>
        </section>

        <section className="legal-section">
          <h2>Contact</h2>
          <p>
            Pour toute question ou réclamation :{' '}
            <a href="mailto:contact@invoice-reminder.app">contact@invoice-reminder.app</a>
          </p>
        </section>
      </div>
    </div>
  )
}
