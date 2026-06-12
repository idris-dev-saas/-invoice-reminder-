# Déploiement — Invoice Reminder SaaS

## 1. Supabase (Base de données)

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Aller dans **Settings > Database > Connection string**
   - **Transaction mode** → `DATABASE_URL` (utilisé par l'app au runtime)
   - **Direct connection** → `DIRECT_URL` (utilisé par Prisma pour les migrations)
3. Dans le `.env` de production, renseigner les deux URLs

## 2. Resend (Emails)

1. Créer un compte sur [resend.com](https://resend.com)
2. Ajouter et vérifier ton domaine
3. Générer une API key → `RESEND_API_KEY`
4. Mettre à jour `RESEND_FROM` avec l'adresse vérifiée

## 3. Stripe

1. Créer un compte sur [stripe.com](https://stripe.com)
2. Créer deux produits (Plan Pro et Plan Business) avec leurs prix mensuels
3. Copier les Price IDs → `STRIPE_PRO_PRICE_ID` et `STRIPE_BUSINESS_PRICE_ID`
4. Copier la clé secrète → `STRIPE_SECRET_KEY`
5. Créer un endpoint webhook sur `https://your-app.vercel.app/api/stripe/webhook`
   - Events à activer : `checkout.session.completed`, `customer.subscription.created`,
     `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
6. Copier le Webhook signing secret → `STRIPE_WEBHOOK_SECRET`

## 4. Variables d'environnement sur Vercel

Dans **Vercel Dashboard > Settings > Environment Variables** :

| Variable | Valeur |
|---|---|
| `DATABASE_URL` | Transaction mode URL (Supabase) |
| `DIRECT_URL` | Direct connection URL (Supabase) |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` |
| `RESEND_API_KEY` | Clé API Resend |
| `RESEND_FROM` | `Invoice Reminder <noreply@yourdomain.com>` |
| `CRON_SECRET` | `openssl rand -hex 32` |
| `STRIPE_SECRET_KEY` | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` |
| `STRIPE_PRO_PRICE_ID` | `price_...` |
| `STRIPE_BUSINESS_PRICE_ID` | `price_...` |

## 5. Migration base de données (prod)

Utiliser `prisma db push` (pas `migrate deploy` — le schéma est géré via db push) :

```bash
# Depuis la machine locale avec DIRECT_URL pointant sur Supabase :
DIRECT_URL="postgresql://..." npx prisma db push
```

## 6. Déployer sur Vercel

```bash
npm i -g vercel
vercel --prod
```

Ou connecter le repo GitHub dans le dashboard Vercel → déploiement automatique sur push.

## 7. Cron Job

`vercel.json` configure automatiquement le cron — il s'exécute chaque jour à **8h UTC**.

Tester manuellement :

```bash
curl -X POST https://your-app.vercel.app/api/cron/reminders \
  -H "Authorization: Bearer <CRON_SECRET>"
```

## 8. Vérification post-déploiement

- [ ] Créer un compte
- [ ] Créer une facture avec une date passée
- [ ] Déclencher le cron manuellement → vérifier les logs Vercel
- [ ] Tester le checkout Stripe (mode test)
- [ ] Vérifier la réception du webhook dans Stripe Dashboard
- [ ] Activer les clés Stripe live et basculer `sk_test_` → `sk_live_`
