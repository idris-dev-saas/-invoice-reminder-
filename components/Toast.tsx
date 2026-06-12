'use client'
import { createContext, useContext, useState, useCallback } from 'react'

interface ToastItem {
  id:      string
  type:    'success' | 'error' | 'info'
  message: string
}

interface ToastCtx {
  success: (msg: string) => void
  error:   (msg: string) => void
  info:    (msg: string) => void
}

const Ctx = createContext<ToastCtx | null>(null)

export function useToast(): ToastCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

let uid = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const push = useCallback((type: ToastItem['type'], message: string) => {
    const id = String(++uid)
    setToasts(prev => [...prev.slice(-2), { id, type, message }])
    setTimeout(() => dismiss(id), 3500)
  }, [dismiss])

  const ctx: ToastCtx = {
    success: (msg) => push('success', msg),
    error:   (msg) => push('error',   msg),
    info:    (msg) => push('info',    msg),
  }

  return (
    <Ctx.Provider value={ctx}>
      {children}
      <div className="toast-container" aria-live="polite" aria-atomic="false">
        {toasts.map(t => (
          <div
            key={t.id}
            role="status"
            className={`toast toast-${t.type}`}
            onClick={() => dismiss(t.id)}
          >
            <span className="toast-dot" />
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}
