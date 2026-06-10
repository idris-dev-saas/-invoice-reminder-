import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="text-center max-w-lg px-4">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Invoice Reminder</h1>
        <p className="text-slate-600 mb-8">
          Gérez vos factures et envoyez des relances automatiques à vos clients.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Se connecter
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100"
          >
            S&apos;inscrire
          </Link>
        </div>
      </div>
    </main>
  )
}
