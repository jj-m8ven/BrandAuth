import { create } from 'zustand'
import type { Toast } from '@/types'

interface AppStore {
  // Notifications
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void

  // Brand context (brand portal only)
  activeBrandId: string | null
  setActiveBrandId: (id: string | null) => void
}

export const useAppStore = create<AppStore>((set) => ({
  toasts: [],
  addToast: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        { ...toast, id: crypto.randomUUID() },
      ],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  activeBrandId: null,
  setActiveBrandId: (id) => set({ activeBrandId: id }),
}))
