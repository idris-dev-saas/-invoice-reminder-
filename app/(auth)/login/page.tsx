'use client'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form = e.currentTarget
    const result = await signIn('credentials', {
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      password: (form.elements.namedItem('password') as HTMLInputElement).value,
      redirect: false,
    })
    setLoading(false)
    if (result?.error) {
      setError('Email ou mot de passe incorrect')
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
        <h1 className="auth-heading">Connexion</h1>
        <form onSubmit={handleSubmit} className="auth-form">
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
              required
              autoComplete="current-password"
              className="form-input"
              placeholder="••••••••"
            />
          </div>
          {error && <div className="form-error">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-full btn-lg"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
        <p className="auth-footer">
          Pas encore de compte ?{' '}
          <Link href="/register">S&apos;inscrire</Link>
        </p>
      </div>
    </main>
  )
}
