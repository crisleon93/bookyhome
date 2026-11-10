import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const ToastContext = createContext(null)

const formatToastMessage = (message) => {
  if (typeof message === 'string' || typeof message === 'number') return String(message)
  if (Array.isArray(message)) {
    return message.map(formatToastMessage).filter(Boolean).join(' | ')
  }
  if (message && typeof message === 'object') {
    return formatToastMessage(message.msg || message.detail || message.message || 'Ha ocurrido un error')
  }
  return 'Ha ocurrido un error'
}

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'info') => {
    setToast({ message: formatToastMessage(message), type })
  }

  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(null), 3200)
    return () => clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    const handler = (event) => {
      const detail = event.detail || {}
      if (detail.message) showToast(detail.message, detail.type || 'info')
    }
    window.addEventListener('bookyhome:toast', handler)
    return () => window.removeEventListener('bookyhome:toast', handler)
  }, [])

  const value = useMemo(() => ({ showToast }), [])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <div className={`toast toast--${toast.type}`} role="status" aria-live="polite">
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastContext)

// eslint-disable-next-line react-refresh/only-export-components
export const notify = (message, type = 'info') => {
  window.dispatchEvent(new CustomEvent('bookyhome:toast', { detail: { message, type } }))
}
