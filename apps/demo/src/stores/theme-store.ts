/**
 * Theme store for demo application.
 *
 * Demonstrates simple store usage without middleware complexity.
 */

'use client'

import { create } from 'zustand-lite'
import { persist } from 'zustand-lite/middleware'

// ============================================================
// TYPES
// ============================================================

export type Theme = 'light' | 'dark' | 'system'

export interface ThemeState {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
}

export interface ThemeActions {
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

export type ThemeStore = ThemeState & ThemeActions

// ============================================================
// HELPERS
// ============================================================

/**
 * Get system theme preference.
 */
function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

/**
 * Resolve theme based on preference.
 */
function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return getSystemTheme()
  }
  return theme
}

/**
 * Apply theme to document.
 */
function applyTheme(resolvedTheme: 'light' | 'dark'): void {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  if (resolvedTheme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

// ============================================================
// STORE
// ============================================================

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'system',
      resolvedTheme: 'light',

      setTheme: (theme) => {
        const resolvedTheme = resolveTheme(theme)
        applyTheme(resolvedTheme)
        set({ theme, resolvedTheme })
      },

      toggleTheme: () => {
        const current = get().resolvedTheme
        const newTheme = current === 'light' ? 'dark' : 'light'
        applyTheme(newTheme)
        set({ theme: newTheme, resolvedTheme: newTheme })
      },
    }),
    {
      name: 'theme-storage',
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        if (state) {
          const resolvedTheme = resolveTheme(state.theme)
          applyTheme(resolvedTheme)
          state.resolvedTheme = resolvedTheme
        }
      },
    }
  )
)

// Listen for system theme changes
if (typeof window !== 'undefined') {
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', (e) => {
      const state = useThemeStore.getState()
      if (state.theme === 'system') {
        const resolvedTheme = e.matches ? 'dark' : 'light'
        applyTheme(resolvedTheme)
        useThemeStore.setState({ resolvedTheme })
      }
    })
}
