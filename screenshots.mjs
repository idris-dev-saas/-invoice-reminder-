import { chromium } from 'playwright'
import { mkdir } from 'fs/promises'
import { existsSync } from 'fs'

const OUT = '/Users/idris/.claude/jobs/d7f16fa8/tmp/screens'
if (!existsSync(OUT)) await mkdir(OUT, { recursive: true })

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

// 1. Landing page
await page.goto('http://localhost:3000')
await page.waitForLoadState('networkidle')
await page.screenshot({ path: `${OUT}/01-landing.png`, fullPage: true })
console.log('✓ Landing page')

// 2. Register page
await page.goto('http://localhost:3000/register')
await page.waitForLoadState('networkidle')
await page.screenshot({ path: `${OUT}/02-register.png`, fullPage: true })
console.log('✓ Register page')

// 3. Login page
await page.goto('http://localhost:3000/login')
await page.waitForLoadState('networkidle')
await page.screenshot({ path: `${OUT}/03-login.png`, fullPage: true })
console.log('✓ Login page')

// 4. Login with wrong credentials (error state)
await page.fill('input[type="email"]', 'test@test.com')
await page.fill('input[type="password"]', 'wrongpassword')
await page.click('button[type="submit"]')
await page.waitForTimeout(2000)
await page.screenshot({ path: `${OUT}/04-login-error.png`, fullPage: true })
console.log('✓ Login error state')

// 5. Dashboard redirect (unauthenticated)
await page.goto('http://localhost:3000/dashboard')
await page.waitForLoadState('networkidle')
await page.screenshot({ path: `${OUT}/05-dashboard-redirect.png`, fullPage: true })
console.log('✓ Dashboard redirect')

// 6. Simulate invoice form modal (inject mock session via UI)
// Since we can't auth without a real DB, inject mock HTML to show the form
await page.goto('http://localhost:3000/login')
await page.waitForLoadState('networkidle')
// Inject a mock version of the invoice form directly into the page for visual preview
await page.evaluate(() => {
  document.body.innerHTML = `
    <div style="font-family:Arial,sans-serif;background:#f8fafc;min-height:100vh;padding:0;">
      <header style="background:white;border-bottom:1px solid #e2e8f0;padding:16px 32px;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:18px;font-weight:700;color:#0f172a;">Invoice Reminder</span>
        <button style="font-size:14px;color:#64748b;">Déconnexion</button>
      </header>
      <div style="max-width:900px;margin:0 auto;padding:32px 16px;">
        <div style="margin-bottom:24px;display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <h2 style="font-size:24px;font-weight:700;color:#0f172a;margin:0;">Mes factures</h2>
            <p style="color:#dc2626;font-size:14px;margin-top:4px;">2 factures en retard</p>
          </div>
        </div>
        <div style="display:flex;justify-content:flex-end;margin-bottom:16px;">
          <button style="padding:8px 16px;background:#2563eb;color:white;border:none;border-radius:8px;font-size:14px;">+ Nouvelle facture</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:12px;">
          <div style="background:white;border:1px solid #fecaca;border-radius:12px;padding:16px;display:flex;justify-content:space-between;align-items:center;">
            <div>
              <p style="font-weight:600;color:#0f172a;margin:0;">Acme Corp</p>
              <p style="color:#64748b;font-size:14px;margin:4px 0;">acme@acme.com</p>
              <p style="color:#64748b;font-size:14px;margin:0;">Échéance : 01/05/2026</p>
            </div>
            <div style="display:flex;align-items:center;gap:12px;">
              <span style="font-weight:700;color:#0f172a;">3 500,00 €</span>
              <span style="background:#fee2e2;color:#991b1b;padding:4px 10px;border-radius:9999px;font-size:12px;font-weight:600;">En retard</span>
              <button style="font-size:12px;color:#15803d;border:1px solid #86efac;padding:4px 8px;border-radius:4px;">Marquer payée</button>
              <button style="font-size:12px;color:#dc2626;">Supprimer</button>
            </div>
          </div>
          <div style="background:white;border:1px solid #fecaca;border-radius:12px;padding:16px;display:flex;justify-content:space-between;align-items:center;">
            <div>
              <p style="font-weight:600;color:#0f172a;margin:0;">Studio Pixel</p>
              <p style="color:#64748b;font-size:14px;margin:4px 0;">contact@studiopixel.fr</p>
              <p style="color:#64748b;font-size:14px;margin:0;">Échéance : 15/05/2026</p>
            </div>
            <div style="display:flex;align-items:center;gap:12px;">
              <span style="font-weight:700;color:#0f172a;">1 200,00 €</span>
              <span style="background:#fee2e2;color:#991b1b;padding:4px 10px;border-radius:9999px;font-size:12px;font-weight:600;">En retard</span>
              <button style="font-size:12px;color:#15803d;border:1px solid #86efac;padding:4px 8px;border-radius:4px;">Marquer payée</button>
              <button style="font-size:12px;color:#dc2626;">Supprimer</button>
            </div>
          </div>
          <div style="background:white;border:1px solid #e2e8f0;border-radius:12px;padding:16px;display:flex;justify-content:space-between;align-items:center;">
            <div>
              <p style="font-weight:600;color:#0f172a;margin:0;">Dev Freelance SARL</p>
              <p style="color:#64748b;font-size:14px;margin:4px 0;">hello@devfreelance.fr</p>
              <p style="color:#64748b;font-size:14px;margin:0;">Échéance : 30/06/2026</p>
            </div>
            <div style="display:flex;align-items:center;gap:12px;">
              <span style="font-weight:700;color:#0f172a;">800,00 €</span>
              <span style="background:#fef9c3;color:#854d0e;padding:4px 10px;border-radius:9999px;font-size:12px;font-weight:600;">Impayée</span>
              <button style="font-size:12px;color:#15803d;border:1px solid #86efac;padding:4px 8px;border-radius:4px;">Marquer payée</button>
              <button style="font-size:12px;color:#dc2626;">Supprimer</button>
            </div>
          </div>
          <div style="background:white;border:1px solid #e2e8f0;border-radius:12px;padding:16px;display:flex;justify-content:space-between;align-items:center;">
            <div>
              <p style="font-weight:600;color:#0f172a;margin:0;">Marie Dupont</p>
              <p style="color:#64748b;font-size:14px;margin:4px 0;">marie.dupont@gmail.com</p>
              <p style="color:#64748b;font-size:14px;margin:0;">Échéance : 01/04/2026</p>
            </div>
            <div style="display:flex;align-items:center;gap:12px;">
              <span style="font-weight:700;color:#0f172a;">450,00 €</span>
              <span style="background:#dcfce7;color:#166534;padding:4px 10px;border-radius:9999px;font-size:12px;font-weight:600;">Payée</span>
              <button style="font-size:12px;color:#dc2626;">Supprimer</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
await page.screenshot({ path: `${OUT}/06-dashboard.png`, fullPage: true })
console.log('✓ Dashboard (mock)')

// 7. Invoice form modal
await page.evaluate(() => {
  document.body.innerHTML += `
    <div style="position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:50;">
      <div style="background:white;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,0.2);padding:24px;width:100%;max-width:440px;">
        <h2 style="font-size:20px;font-weight:700;color:#0f172a;margin:0 0 16px;">Nouvelle facture</h2>
        <div style="display:flex;flex-direction:column;gap:12px;">
          <div>
            <label style="display:block;font-size:14px;font-weight:500;color:#374151;margin-bottom:4px;">Nom du client</label>
            <input value="Acme Corp" style="width:100%;border:1px solid #d1d5db;border-radius:8px;padding:8px 12px;font-size:14px;box-sizing:border-box;" readonly/>
          </div>
          <div>
            <label style="display:block;font-size:14px;font-weight:500;color:#374151;margin-bottom:4px;">Email du client</label>
            <input value="contact@acme.com" type="email" style="width:100%;border:1px solid #d1d5db;border-radius:8px;padding:8px 12px;font-size:14px;box-sizing:border-box;" readonly/>
          </div>
          <div style="display:flex;gap:8px;">
            <div style="flex:1;">
              <label style="display:block;font-size:14px;font-weight:500;color:#374151;margin-bottom:4px;">Montant</label>
              <input value="3500" type="number" style="width:100%;border:1px solid #d1d5db;border-radius:8px;padding:8px 12px;font-size:14px;box-sizing:border-box;" readonly/>
            </div>
            <div style="width:80px;">
              <label style="display:block;font-size:14px;font-weight:500;color:#374151;margin-bottom:4px;">Devise</label>
              <input value="EUR" style="width:100%;border:1px solid #d1d5db;border-radius:8px;padding:8px 12px;font-size:14px;box-sizing:border-box;" readonly/>
            </div>
          </div>
          <div>
            <label style="display:block;font-size:14px;font-weight:500;color:#374151;margin-bottom:4px;">Date d'échéance</label>
            <input value="2026-07-15" type="date" style="width:100%;border:1px solid #d1d5db;border-radius:8px;padding:8px 12px;font-size:14px;box-sizing:border-box;" readonly/>
          </div>
          <div style="display:flex;gap:8px;padding-top:8px;">
            <button style="flex:1;border:1px solid #d1d5db;color:#374151;padding:8px;border-radius:8px;background:white;">Annuler</button>
            <button style="flex:1;background:#2563eb;color:white;padding:8px;border-radius:8px;border:none;">Créer</button>
          </div>
        </div>
      </div>
    </div>
  `
})
await page.screenshot({ path: `${OUT}/07-invoice-form.png`, fullPage: false })
console.log('✓ Invoice form modal')

await browser.close()
console.log('\nAll screenshots saved to:', OUT)
