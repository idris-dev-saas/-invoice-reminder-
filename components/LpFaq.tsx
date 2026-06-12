'use client'
import { useState } from 'react'

const FAQS = [
  {
    q: 'Comment fonctionnent les relances automatiques ?',
    a: 'Une fois votre facture créée avec une date d\'échéance, Invoice Reminder surveille chaque impayé. Dès que la date est dépassée, des emails de relance sont envoyés automatiquement à votre client : J+3 (rappel neutre), J+7 (rappel urgent), J+14 (mise en demeure ferme). Aucune action de votre part n\'est nécessaire.',
  },
  {
    q: 'Mes clients recevront-ils trop d\'emails ?',
    a: 'Non. Le système envoie au maximum 3 emails par facture impayée (J+3, J+7, J+14). Dès que vous marquez la facture comme payée, toutes les relances s\'arrêtent immédiatement. Un client qui règle après le premier rappel ne reçoit jamais le second.',
  },
  {
    q: 'Que se passe-t-il si une facture est déjà payée ?',
    a: 'Vous marquez simplement la facture comme "Payée" dans le dashboard. Le système archive la date de paiement, stoppe toute relance future et met à jour vos analytics de recouvrement en temps réel. Une fois payée, la facture est verrouillée et ne peut plus être modifiée.',
  },
  {
    q: 'Mes données et celles de mes clients sont-elles sécurisées ?',
    a: 'Oui. Chaque compte est totalement isolé : aucun utilisateur ne peut accéder aux données d\'un autre. Les mots de passe sont hachés (bcrypt), toutes les communications sont chiffrées (HTTPS), et des mécanismes anti-abus (rate limiting) protègent les accès. Nous n\'avons jamais accès à vos coordonnées bancaires, traitées exclusivement par Stripe.',
  },
  {
    q: 'Puis-je annuler mon abonnement ?',
    a: 'Oui, à tout moment depuis la page Abonnement de votre compte. L\'annulation prend effet à la fin de la période déjà facturée : vous conservez l\'accès aux fonctionnalités payantes jusqu\'à cette date. Votre compte repasse ensuite automatiquement sur le plan Gratuit.',
  },
  {
    q: 'Quelle est la différence entre les plans Gratuit, Pro et Business ?',
    a: 'Le plan Gratuit est limité à 5 factures actives avec une relance J+3 uniquement. Le plan Pro (12€/mois) lève toutes les limites : factures illimitées, 3 niveaux de relance (J+3, J+7, J+14), export PDF et suppression du branding Invoice Reminder dans les emails. Le plan Business (29€/mois) inclut tout le Pro avec un support prioritaire, et prépare des fonctionnalités d\'équipe à venir.',
  },
]

export function LpFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="lp-section" id="faq">
      <div className="lp-section-inner">
        <div className="lp-section-header">
          <h2 className="lp-section-title">Questions fréquentes</h2>
          <p className="lp-section-sub">
            Tout ce que vous devez savoir avant de démarrer.
          </p>
        </div>
        <div className="lp-faq">
          {FAQS.map((item, i) => {
            const isOpen = openIndex === i
            return (
              <div key={i} className={`lp-faq-item${isOpen ? ' lp-faq-item-open' : ''}`}>
                <button
                  className="lp-faq-q"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${i}`}
                >
                  <span>{item.q}</span>
                  <span className="lp-faq-icon" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6"
                        strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                </button>
                <div
                  id={`faq-answer-${i}`}
                  className={`lp-faq-a-wrap${isOpen ? ' lp-faq-a-open' : ''}`}
                  role="region"
                  aria-hidden={!isOpen}
                >
                  <div className="lp-faq-a">
                    <div className="lp-faq-a-inner">
                      <p>{item.a}</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
