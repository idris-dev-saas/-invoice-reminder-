import Link from 'next/link'
import { PLAN_CONFIG } from '@/lib/plan'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { LpFaq } from '@/components/LpFaq'
import { LpImage } from '@/components/LpImage'

export default async function Home() {
  const session    = await getServerSession(authOptions)
  const isLoggedIn = !!session

  return (
    <div className="lp">

      {/* ── Nav ────────────────────────────────────────────────── */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <div className="app-logo">
            <span className="app-logo-dot" />
            Invoice Reminder
          </div>
          <div className="lp-nav-links">
            <a href="#how" className="lp-nav-link">Comment ça marche</a>
            <a href="#pricing" className="lp-nav-link">Tarifs</a>
          </div>
          <div className="lp-nav-actions">
            {isLoggedIn ? (
              <Link href="/dashboard" className="btn btn-primary">Accéder au dashboard</Link>
            ) : (
              <>
                <Link href="/login"    className="btn btn-ghost">Se connecter</Link>
                <Link href="/register" className="btn btn-primary">Commencer</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <div className="lp-hero-text">
            <span className="lp-eyebrow">Relances automatiques</span>
            <h1 className="lp-headline">
              Vos factures,<br />payées à temps.
            </h1>
            <p className="lp-sub">
              Créez vos factures, Invoice Reminder envoie les relances à
              vos clients à J+3, J+7 et J+14 sans que vous ayez à y penser.
            </p>
            <div className="lp-hero-actions">
              {isLoggedIn ? (
                <Link href="/dashboard" className="btn btn-primary btn-lg">
                  Accéder au dashboard
                </Link>
              ) : (
                <>
                  <Link href="/register" className="btn btn-primary btn-lg">
                    Commencer gratuitement
                  </Link>
                  <Link href="/login" className="btn btn-secondary btn-lg">
                    Se connecter
                  </Link>
                </>
              )}
            </div>
            {!isLoggedIn && (
              <p className="lp-hero-note">Gratuit · Aucune carte requise · Prêt en 2 minutes</p>
            )}
          </div>

          <div className="lp-hero-visual">
            <ProductPreview />
          </div>
        </div>
      </section>

      {/* ── Trust bar ───────────────────────────────────────────── */}
      <div className="lp-trust">
        <div className="lp-trust-inner">
          <TrustItem icon={<ShieldIcon />} label="Données isolées par compte" />
          <div className="lp-trust-sep" />
          <TrustItem icon={<CheckDoubleIcon />} label="Zéro doublon garanti" />
          <div className="lp-trust-sep" />
          <TrustItem icon={<ClockIcon />} label="Cron automatique chaque matin" />
          <div className="lp-trust-sep" />
          <TrustItem icon={<BellIcon />} label="3 niveaux de relance" />
        </div>
      </div>

      {/* ── Comment ça marche ───────────────────────────────────── */}
      <section className="lp-section" id="how">
        <div className="lp-section-inner">
          <div className="lp-section-header">
            <h2 className="lp-section-title">Simple à utiliser, automatique en coulisse</h2>
            <p className="lp-section-sub">
              Trois étapes, aucune maintenance, aucune relance à écrire.
            </p>
          </div>
          <div className="lp-steps">
            <div className="lp-step">
              <div className="lp-step-num">1</div>
              <div className="lp-step-body">
                <strong>Créez une facture</strong>
                <span>Nom du client, montant et date d'échéance. En moins de 30 secondes.</span>
              </div>
            </div>
            <div className="lp-step-connector" />
            <div className="lp-step">
              <div className="lp-step-num">2</div>
              <div className="lp-step-body">
                <strong>Les relances partent seules</strong>
                <span>Dès la date dépassée, vos clients reçoivent un rappel email professionnel.</span>
              </div>
            </div>
            <div className="lp-step-connector" />
            <div className="lp-step">
              <div className="lp-step-num">3</div>
              <div className="lp-step-body">
                <strong>Vous encaissez</strong>
                <span>Marquez la facture payée. Suivez votre taux de recouvrement en temps réel.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Image lifestyle ─────────────────────────────────────── */}
      <section className="lp-showcase">
        <div className="lp-showcase-inner">
          <div className="lp-showcase-img-wrap">
            <LpImage
              src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=900&q=80&auto=format&fit=crop"
              alt="Dashboard analytics sur ordinateur portable"
              className="lp-showcase-img"
              loading="lazy"
            />
          </div>
          <div className="lp-showcase-text">
            <span className="lp-eyebrow">Pour les indépendants</span>
            <h2 className="lp-showcase-title">
              Arrêtez de relancer manuellement.
            </h2>
            <p className="lp-showcase-desc">
              Chaque freelance perd en moyenne 4 heures par mois à relancer
              ses clients. Invoice Reminder automatise tout le processus
              et vous laisse vous concentrer sur votre travail.
            </p>
            <ul className="lp-showcase-list">
              <li><CheckSmIcon /> Email de rappel à J+3, J+7, J+14</li>
              <li><CheckSmIcon /> Le bon ton au bon moment</li>
              <li><CheckSmIcon /> Aucun client ne passe à travers les mailles</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────── */}
      <section className="lp-section lp-section-alt">
        <div className="lp-section-inner">
          <div className="lp-section-header">
            <h2 className="lp-section-title">Tout ce qu'il vous faut</h2>
          </div>
          <div className="lp-features">
            <div className="lp-feature">
              <div className="lp-feature-icon"><BellFillIcon /></div>
              <strong>3 relances automatiques</strong>
              <span>J+3, J+7 et J+14 — chaque impayé reçoit ses rappels sans action de votre part.</span>
            </div>
            <div className="lp-feature">
              <div className="lp-feature-icon"><LockIcon /></div>
              <strong>Zéro doublon garanti</strong>
              <span>Notre système vérifie chaque envoi, un client ne reçoit jamais deux fois le même email.</span>
            </div>
            <div className="lp-feature">
              <div className="lp-feature-icon"><ChartIcon /></div>
              <strong>Analytics en temps réel</strong>
              <span>Encaissé, en attente, en retard, taux de recouvrement, tout visible d'un coup d'oeil.</span>
            </div>
            <div className="lp-feature">
              <div className="lp-feature-icon"><FileIcon /></div>
              <strong>Export PDF professionnel</strong>
              <span>Générez et téléchargez vos factures en PDF en un clic.</span>
            </div>
            <div className="lp-feature">
              <div className="lp-feature-icon"><HashIcon /></div>
              <strong>Numérotation automatique</strong>
              <span>Chaque facture reçoit un numéro séquentiel (INV-0001, INV-0002...) sans configuration.</span>
            </div>
            <div className="lp-feature">
              <div className="lp-feature-icon"><MailIcon /></div>
              <strong>Emails professionnels</strong>
              <span>J+3 neutres, J+7 urgents, J+14 fermes. Le bon ton selon le niveau de retard.</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────── */}
      <section className="lp-section" id="pricing">
        <div className="lp-section-inner">
          <div className="lp-section-header">
            <h2 className="lp-section-title">Tarifs simples, sans surprise</h2>
            <p className="lp-section-sub">
              Commencez gratuitement. Passez au Pro quand vous en avez besoin.
            </p>
          </div>
          <div className="lp-pricing">

            {/* Gratuit */}
            <div className="lp-plan">
              <div className="lp-plan-header">
                <div className="lp-plan-name">{PLAN_CONFIG.FREE.label}</div>
                <p className="lp-plan-desc">{PLAN_CONFIG.FREE.tagline}</p>
              </div>
              <div className="lp-plan-price">
                <span className="lp-plan-amount">{PLAN_CONFIG.FREE.price}</span>
                <div className="lp-plan-price-right">
                  <span className="lp-plan-currency">€</span>
                  <span className="lp-plan-period">/ mois</span>
                </div>
              </div>
              <Link href="/register" className="lp-plan-cta lp-plan-cta-ghost">
                Commencer gratuitement
                <ArrowRightIcon />
              </Link>
              <div className="lp-plan-divider" />
              <ul className="lp-plan-features">
                {PLAN_CONFIG.FREE.features.map((f) => (
                  <li key={f.label}><PlanCheck /><span>{f.label}</span></li>
                ))}
              </ul>
            </div>

            {/* Pro — mis en avant */}
            <div className="lp-plan lp-plan-pro">
              <div className="lp-plan-badge">Le plus populaire</div>
              <div className="lp-plan-header">
                <div className="lp-plan-name">{PLAN_CONFIG.PRO.label}</div>
                <p className="lp-plan-desc">{PLAN_CONFIG.PRO.tagline}</p>
              </div>
              <div className="lp-plan-price">
                <span className="lp-plan-amount">{PLAN_CONFIG.PRO.price}</span>
                <div className="lp-plan-price-right">
                  <span className="lp-plan-currency">€</span>
                  <span className="lp-plan-period">/ mois</span>
                </div>
              </div>
              <Link href="/register" className="lp-plan-cta lp-plan-cta-solid">
                Commencer avec Pro
                <ArrowRightIcon />
              </Link>
              <div className="lp-plan-divider" />
              <ul className="lp-plan-features">
                {PLAN_CONFIG.PRO.features.map((f) => (
                  <li key={f.label}><PlanCheck highlight /><span>{f.label}</span></li>
                ))}
              </ul>
            </div>

            {/* Business */}
            <div className="lp-plan">
              <div className="lp-plan-header">
                <div className="lp-plan-name">{PLAN_CONFIG.BUSINESS.label}</div>
                <p className="lp-plan-desc">{PLAN_CONFIG.BUSINESS.tagline}</p>
              </div>
              <div className="lp-plan-price">
                <span className="lp-plan-amount">{PLAN_CONFIG.BUSINESS.price}</span>
                <div className="lp-plan-price-right">
                  <span className="lp-plan-currency">€</span>
                  <span className="lp-plan-period">/ mois</span>
                </div>
              </div>
              <Link href="/register" className="lp-plan-cta lp-plan-cta-ghost">
                Commencer avec Business
                <ArrowRightIcon />
              </Link>
              <div className="lp-plan-divider" />
              <ul className="lp-plan-features">
                {PLAN_CONFIG.BUSINESS.features.map((f) => (
                  <li key={f.label} className={f.soon ? 'lp-plan-feature-soon' : ''}>
                    <PlanCheck />
                    <span>{f.label}</span>
                    {f.soon && <span className="lp-soon-tag">Bientôt</span>}
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* ── Social proof ────────────────────────────────────────── */}
      <section className="lp-section lp-section-alt">
        <div className="lp-section-inner">
          <div className="lp-proof">
            <div className="lp-proof-text">
              <span className="lp-eyebrow">Pour les indépendants et petites entreprises</span>
              <h2 className="lp-proof-title">
                Conçu pour ceux qui travaillent seuls ou en petite équipe.
              </h2>
              <p className="lp-proof-desc">
                Lancé en 2026 — nous cherchons nos premiers utilisateurs et construisons
                le produit avec leurs retours.
              </p>
              <ul className="lp-proof-list">
                <li><ProofCheck />Relances automatiques sans action manuelle</li>
                <li><ProofCheck />Suivi des impayés en temps réel</li>
                <li><ProofCheck />Export PDF prêt à envoyer</li>
                <li><ProofCheck />Interface en français, simple et directe</li>
              </ul>
            </div>
            <div className="lp-proof-stats">
              <div className="lp-proof-stat">
                <span className="lp-proof-stat-val">3</span>
                <span className="lp-proof-stat-label">Niveaux de relance</span>
              </div>
              <div className="lp-proof-stat">
                <span className="lp-proof-stat-val">0€</span>
                <span className="lp-proof-stat-label">Pour commencer</span>
              </div>
              <div className="lp-proof-stat">
                <span className="lp-proof-stat-val">&lt;30s</span>
                <span className="lp-proof-stat-label">Pour créer une facture</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────── */}
      <LpFaq />

      {/* ── CTA final ───────────────────────────────────────────── */}
      <section className="lp-cta">
        <div className="lp-cta-inner">
          <img
            src="https://images.unsplash.com/photo-1553484771-371a605b060b?w=1400&q=80&auto=format&fit=crop"
            alt=""
            className="lp-cta-bg"
            aria-hidden="true"
            loading="lazy"
          />
          <div className="lp-cta-overlay" />
          <div className="lp-cta-content">
            <h2 className="lp-cta-title">
              Prêt à arrêter de relancer manuellement ?
            </h2>
            <p className="lp-cta-sub">
              {isLoggedIn
                ? 'Votre dashboard vous attend.'
                : 'Créez votre compte en 30 secondes. Gratuit, sans carte bancaire.'}
            </p>
            <Link
              href={isLoggedIn ? '/dashboard' : '/register'}
              className="btn btn-lg lp-cta-btn"
            >
              {isLoggedIn ? 'Accéder au dashboard' : 'Commencer gratuitement'}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="app-logo">
            <span className="app-logo-dot" />
            Invoice Reminder
          </div>
          <div className="lp-footer-cols">
            <div className="lp-footer-col">
              <span className="lp-footer-col-title">Produit</span>
              <Link href="/login">Connexion</Link>
              <Link href="/register">Inscription</Link>
              <a href="#pricing">Tarifs</a>
              <a href="#faq">FAQ</a>
            </div>
            <div className="lp-footer-col">
              <span className="lp-footer-col-title">Légal</span>
              <Link href="/privacy">Confidentialité</Link>
              <Link href="/terms">CGU</Link>
              <Link href="/legal">Mentions légales</Link>
            </div>
            <div className="lp-footer-col">
              <span className="lp-footer-col-title">Contact</span>
              <a href="mailto:contact@invoice-reminder.app">contact@invoice-reminder.app</a>
            </div>
          </div>
          <span className="lp-footer-copy">© {new Date().getFullYear()} Invoice Reminder</span>
        </div>
      </footer>

    </div>
  )
}

/* ── Product preview mockup ─────────────────────────────────── */

function ProductPreview() {
  return (
    <div className="lp-preview">
      <div className="lp-preview-topbar">
        <span className="lp-preview-dot" />
        <span className="lp-preview-dot" />
        <span className="lp-preview-dot" />
        <span className="lp-preview-title">Invoice Reminder</span>
      </div>

      <div className="lp-preview-kpis">
        <div className="lp-preview-kpi">
          <span className="lp-preview-kval lp-preview-kval-green">4 850 €</span>
          <span className="lp-preview-klabel">Encaissé</span>
        </div>
        <div className="lp-preview-kpi">
          <span className="lp-preview-kval lp-preview-kval-amber">2 300 €</span>
          <span className="lp-preview-klabel">En attente</span>
        </div>
        <div className="lp-preview-kpi lp-preview-kpi-danger">
          <span className="lp-preview-kval">2</span>
          <span className="lp-preview-klabel">En retard</span>
        </div>
        <div className="lp-preview-kpi">
          <span className="lp-preview-kval">68%</span>
          <span className="lp-preview-klabel">Recouvrement</span>
        </div>
      </div>

      <div className="lp-preview-table">
        <div className="lp-preview-th">
          <span>Client</span>
          <span>Montant</span>
          <span>Statut</span>
        </div>
        <div className="lp-preview-row">
          <span className="lp-preview-client">Studio Pixel</span>
          <span className="lp-preview-amount">1 200 €</span>
          <span className="lp-pbadge lp-pbadge-paid">Payée</span>
        </div>
        <div className="lp-preview-row lp-preview-row-overdue">
          <div className="lp-preview-client-wrap">
            <span className="lp-preview-client">Marie Dupont</span>
            <span className="lp-pchip">J+7</span>
          </div>
          <span className="lp-preview-amount">850 €</span>
          <span className="lp-pbadge lp-pbadge-overdue">En retard</span>
        </div>
        <div className="lp-preview-row lp-preview-row-overdue">
          <div className="lp-preview-client-wrap">
            <span className="lp-preview-client">Dev Freelance</span>
            <span className="lp-pchip">J+3</span>
          </div>
          <span className="lp-preview-amount">2 300 €</span>
          <span className="lp-pbadge lp-pbadge-overdue">En retard</span>
        </div>
        <div className="lp-preview-row">
          <span className="lp-preview-client">Acme Corp</span>
          <span className="lp-preview-amount">600 €</span>
          <span className="lp-pbadge lp-pbadge-unpaid">Impayée</span>
        </div>
      </div>
    </div>
  )
}

/* ── Trust item ─────────────────────────────────────────────── */
function TrustItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="lp-trust-item">
      {icon}
      <span>{label}</span>
    </div>
  )
}

/* ── Icons ──────────────────────────────────────────────────── */

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 1.5L2 4v4c0 3.3 2.5 5.6 6 6.5 3.5-.9 6-3.2 6-6.5V4L8 1.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M5.5 8l2 2 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function CheckDoubleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 8.5l3.5 3.5L13 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 8.5l3.5 3.5 3.5-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity=".45"/>
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M8 5v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 1.5a4.5 4.5 0 0 0-4.5 4.5c0 2.5-.8 3.5-1.5 4.5h12c-.7-1-1.5-2-1.5-4.5A4.5 4.5 0 0 0 8 1.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M6.5 10.5a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}

function BellFillIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M9 2a5 5 0 0 0-5 5c0 2.8-1 4-1.8 5h13.6C15 11 14 9.8 14 7a5 5 0 0 0-5-5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M7 12a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="3" y="8" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M6 8V6a3 3 0 1 1 6 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M3 14V8M7 14V5M11 14V9M15 14V3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  )
}

function FileIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M10 2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7L10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 2v5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 11h6M6 8h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function HashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M4 7h10M4 11h10M7 3l-1.5 12M11.5 3 10 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="2" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M2 7l7 4 7-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function CheckSmIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2.5 7l3 3 6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function ProofCheck() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="7.5" cy="7.5" r="7" fill="oklch(92% 0.05 155)" />
      <path d="M4.5 7.5l2 2 4-4" stroke="oklch(40% 0.14 155)" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function PlanCheck({ highlight }: { highlight?: boolean }) {
  return (
    <span className={`lp-plan-check${highlight ? ' lp-plan-check-hl' : ''}`}>
      <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
        <path d="M1.5 5.5l2.8 2.8 5.2-5.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </span>
  )
}

function ArrowRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2.5 7h9M8 3.5l3.5 3.5L8 10.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
