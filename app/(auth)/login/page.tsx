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
    <main className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Connexion</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe</label>
            <input
              name="password"
              type="password"
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
        <p className="text-sm text-slate-600 mt-4 text-center">
          Pas encore de compte ?{' '}
          <Link href="/register" className="text-blue-600 hover:underline">
            S&apos;inscrire
          </Link>
        </p>
      </div>
    </main>
  )
}
