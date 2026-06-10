# Déploiement — Invoice Reminder SaaS

## 1. Supabase (Base de données)

1. Créer un compte sur [supabase.com](https://supabase.com)
2. Créer un nouveau projet
3. Aller dans **Settings > Database > Connection string**
   - Copier la **Transaction mode URL** → c'est ton `DATABASE_URL`
   - Copier la **Direct connection URL** → c'est ton `DIRECT_URL`
4. Mettre à jour `prisma.config.ts` avec la bonne URL si besoin

## 2. Resend (Emails)

1. Créer un compte sur [resend.com](https://resend.com)
2. Ajouter et vérifier ton domaine
3. Générer une API key → c'est ton `RESEND_API_KEY`
4. Dans `services/email.ts`, remplacer `noreply@yourdomain.com` par ton adresse email vérifiée

## 3. Migration base de données

```bash
npx prisma migrate deploy
```

## 4. Variables d'environnement sur Vercel

Dans **Vercel Dashboard > Settings > Environment Variables**, ajouter :

| Variable | Valeur |
|----------|--------|
| `DATABASE_URL` | URL Transaction Supabase |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://ton-projet.vercel.app` |
| `RESEND_API_KEY` | Clé API Resend |
| `CRON_SECRET` | `openssl rand -base64 32` |

Générer les secrets :
```bash
openssl rand -base64 32
```

## 5. Déployer sur Vercel

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel

# Ou connecter le repo GitHub dans le dashboard Vercel
```

## 6. Cron Job

`vercel.json` configure automatiquement le cron job sur Vercel.  
Le endpoint `/api/cron/reminders` s'exécute chaque jour à **8h UTC**.

Vercel appelle ce endpoint avec un header `Authorization: Bearer <CRON_SECRET>`.

## 7. Vérification

Après déploiement :
- Visiter `https://ton-projet.vercel.app`
- Créer un compte
- Créer une facture avec une date d'échéance passée
- Appeler manuellement le cron pour tester :

```bash
curl -X POST https://ton-projet.vercel.app/api/cron/reminders \
  -H "Authorization: Bearer <CRON_SECRET>"
```
