import { create } from 'zustand-lite'

interface CounterDemoState {
  count: number
  increment: () => void
  decrement: () => void
  reset: () => void
}

export const useCounterDemoStore = create<CounterDemoState>((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
  decrement: () => set((s) => ({ count: s.count - 1 })),
  reset: () => set({ count: 0 }),
}))
