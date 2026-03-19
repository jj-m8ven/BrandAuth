'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/stores/appStore'

const typeStyles = {
  success: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-gray-800 text-white',
}

export function ToastQueue() {
  const toasts = useAppStore((s) => s.toasts)
  const removeToast = useAppStore((s) => s.removeToast)

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onDismiss={removeToast}
        />
      ))}
    </div>
  )
}

function ToastItem({
  id,
  message,
  type,
  duration = 4000,
  onDismiss,
}: {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
  duration?: number
  onDismiss: (id: string) => void
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), duration)
    return () => clearTimeout(timer)
  }, [id, duration, onDismiss])

  return (
    <div
      className={`rounded-lg px-4 py-3 shadow-lg text-sm font-medium ${typeStyles[type]} animate-in slide-in-from-right`}
    >
      <div className="flex items-center gap-2">
        <span>{message}</span>
        <button
          onClick={() => onDismiss(id)}
          className="ml-2 opacity-70 hover:opacity-100"
        >
          &times;
        </button>
      </div>
    </div>
  )
}
