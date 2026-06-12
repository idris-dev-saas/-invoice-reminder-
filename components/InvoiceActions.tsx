'use client'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
type Props = {
  invoiceId:      string
  status:         string
  canPdf:         boolean
  isLoading:      boolean
  onMarkPaid:     () => void
  onDeleteIntent: () => void
}

export function InvoiceActions({
  invoiceId, status, canPdf, isLoading, onMarkPaid, onDeleteIntent,
}: Props) {
  const [open, setOpen]       = useState(false)
  const [mounted, setMounted] = useState(false)
  const [rect, setRect]       = useState<DOMRect | null>(null)
  const triggerRef            = useRef<HTMLButtonElement>(null)
  const dropdownRef           = useRef<HTMLDivElement>(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!open) return
    function onMouseDown(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current  && !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown',    onKey)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown',    onKey)
    }
  }, [open])

  function toggle() {
    if (!open && triggerRef.current) {
      setRect(triggerRef.current.getBoundingClientRect())
    }
    setOpen((v) => !v)
  }

  const dropdown = mounted && open && rect && createPortal(
    <div
      ref={dropdownRef}
      className="action-dropdown"
      style={{
        position: 'fixed',
        top:   rect.bottom + 4,
        right: window.innerWidth - rect.right,
      }}
      role="menu"
    >
      {status !== 'PAID' && (
        <button
          className="action-item"
          role="menuitem"
          disabled={isLoading}
          onClick={() => { setOpen(false); onMarkPaid() }}
        >
          <CheckIcon />
          Marquer payée
        </button>
      )}

      {canPdf && (
        <a
          href={`/api/invoices/${invoiceId}/pdf`}
          className="action-item"
          role="menuitem"
          target="_blank"
          rel="noreferrer"
          onClick={() => setOpen(false)}
        >
          <PdfIcon />
          Exporter PDF
        </a>
      )}

      {(status !== 'PAID' || canPdf) && (
        <div className="action-separator" />
      )}

      <button
        className="action-item action-item-danger"
        role="menuitem"
        onClick={() => { setOpen(false); onDeleteIntent() }}
      >
        <TrashIcon />
        Supprimer
      </button>
    </div>,
    document.body,
  )

  return (
    <>
      <button
        ref={triggerRef}
        className="btn-action-trigger"
        onClick={toggle}
        aria-label="Actions"
        aria-expanded={open}
        aria-haspopup="menu"
        disabled={isLoading}
      >
        <DotsIcon />
      </button>
      {dropdown}
    </>
  )
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <path d="M2 7l3.5 3.5L11 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function ReopenIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <path d="M2 6.5A4.5 4.5 0 1 0 6.5 2H4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M4 2L2 4.5L4.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function PdfIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <path d="M7 1.5H3.5A1 1 0 0 0 2.5 2.5v8a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V5L7 1.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 1.5V5h3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <path d="M2 3.5h9M4.5 3.5V2.5h4v1M5 6v3.5M8 6v3.5M3 3.5l.5 7a1 1 0 0 0 1 .9h4a1 1 0 0 0 1-.9l.5-7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function DotsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
      <circle cx="7" cy="3"  r="1.1"/>
      <circle cx="7" cy="7"  r="1.1"/>
      <circle cx="7" cy="11" r="1.1"/>
    </svg>
  )
}
