'use client'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'

export default function RegisterPage() {
  const router  = useRouter()
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form     = e.currentTarget
    const email    = (form.elements.namedItem('email')    as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value
    const name     = (form.elements.namedItem('name')     as HTMLInputElement).value

    const res = await fetch('/api/auth/register', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name, email, password }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || "Erreur lors de l'inscription")
      setLoading(false)
      return
    }

    // Auto-login after registration — no friction
    const result = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)

    if (result?.error) {
      // Inscription réussie mais login auto échoué — rediriger vers login
      router.push('/login')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-lockup">
        <div className="auth-logo">
          <span className="app-logo-dot" />
          Invoice Reminder
        </div>
        <p className="auth-tagline">Gérez vos relances sans effort</p>
      </div>

      <div className="auth-card">
        <h1 className="auth-heading">Créer un compte</h1>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="name">Nom</label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              className="form-input"
              placeholder="Votre nom"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="form-input"
              placeholder="vous@exemple.com"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">Mot de passe</label>
            <input
              id="password"
              name="password"
              type="password"
              minLength={8}
              required
              autoComplete="new-password"
              className="form-input"
              placeholder="8 caractères minimum"
            />
          </div>
          {error && <div className="form-error">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-full btn-lg"
          >
            {loading ? 'Création...' : 'Créer mon compte'}
          </button>
        </form>
        <p className="auth-footer">
          Déjà un compte ?{' '}
          <Link href="/login">Se connecter</Link>
        </p>
      </div>
    </main>
  )
}
