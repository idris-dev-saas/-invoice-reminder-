'use client'

interface Props {
  onCreateClick: () => void
}

export function EmptyState({ onCreateClick }: Props) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
          <rect x="7" y="4" width="22" height="27" rx="3" fill="var(--accent-subtle)" stroke="var(--accent)" strokeWidth="1.5"/>
          <path d="M12 13h12M12 18h12M12 23h7" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>

      <h2 className="empty-state-title">Automatisez vos relances de paiement</h2>
      <p className="empty-state-sub">
        Créez des factures, Invoice Reminder envoie les relances
        automatiquement pour les impayés.
      </p>

      <ol className="onboarding-steps">
        <li className="onboarding-step">
          <span className="onboarding-step-num">1</span>
          <div className="onboarding-step-body">
            <strong>Créez une facture</strong>
            <span>Nom du client, montant et date d'échéance.</span>
          </div>
        </li>
        <li className="onboarding-step">
          <span className="onboarding-step-num">2</span>
          <div className="onboarding-step-body">
            <strong>Les relances partent automatiquement</strong>
            <span>Email de rappel à J+3 dès que la facture est en retard.</span>
          </div>
        </li>
        <li className="onboarding-step">
          <span className="onboarding-step-num">3</span>
          <div className="onboarding-step-body">
            <strong>Marquez les factures payées</strong>
            <span>Suivez votre taux de recouvrement en temps réel.</span>
          </div>
        </li>
      </ol>

      <button onClick={onCreateClick} className="btn btn-primary btn-lg empty-state-cta">
        Créer ma première facture
      </button>
      <p className="empty-state-footnote">Plan Gratuit · 5 factures · relances J+3 incluses</p>
    </div>
  )
}
