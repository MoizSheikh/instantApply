'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { Toast, ToastType, ToastContainer } from '@/components/ui/Toast'

interface ToastContextType {
  showToast: (type: ToastType, title: string, message?: string, duration?: number) => void
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const showToast = (type: ToastType, title: string, message?: string, duration: number = 5000) => {
    const id = Math.random().toString(36).substring(2) + Date.now().toString(36)
    const newToast: Toast = {
      id,
      type,
      title,
      message,
      duration
    }

    setToasts(prev => [...prev, newToast])
  }

  const success = (title: string, message?: string) => {
    showToast('success', title, message)
  }

  const error = (title: string, message?: string) => {
    showToast('error', title, message)
  }

  const warning = (title: string, message?: string) => {
    showToast('warning', title, message)
  }

  const info = (title: string, message?: string) => {
    showToast('info', title, message)
  }

  const value = {
    showToast,
    success,
    error,
    warning,
    info
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
