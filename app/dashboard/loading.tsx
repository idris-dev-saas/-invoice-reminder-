export default function DashboardLoading() {
  return (
    <>
      <header className="app-header">
        <div className="content-wrap">
          <div className="app-logo">
            <span className="app-logo-dot" />
            Invoice Reminder
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="content-wrap">
          {/* KPI skeleton */}
          <div className="kpi-grid" style={{ marginBottom: 'var(--space-6)' }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="kpi-card">
                <div className="skel skel-value" />
                <div className="skel skel-label" />
              </div>
            ))}
          </div>

          {/* Toolbar skeleton */}
          <div className="invoice-toolbar">
            <div className="skel skel-title" />
            <div className="skel skel-btn" />
          </div>

          {/* Table skeleton */}
          <div className="invoice-list">
            <div className="invoice-list-header">
              {['Réf.', 'Client', 'Montant', 'Échéance', 'Statut', ''].map((h) => (
                <span key={h} style={{ color: 'var(--text-3)', fontSize: 'var(--text-xs)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</span>
              ))}
            </div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="invoice-row skel-row">
                <div className="skel skel-ref" />
                <div>
                  <div className="skel skel-name" />
                  <div className="skel skel-email" style={{ marginTop: 4 }} />
                </div>
                <div className="skel skel-amount" style={{ marginLeft: 'auto' }} />
                <div className="skel skel-date" />
                <div className="skel skel-badge" />
                <div />
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  )
}
