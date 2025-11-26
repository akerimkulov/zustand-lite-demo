# zustand-lite

Легковесная (<1KB) библиотека управления состоянием для React.

## Особенности

- **Минималистичный API** — простой и интуитивный
- **TypeScript-first** — полная типизация из коробки
- **Middleware система** — расширяемая архитектура
- **SSR поддержка** — Next.js, Remix и другие
- **SOLID принципы** — чистый и поддерживаемый код
- **Без boilerplate** — минимум кода для максимума результата

## Установка

```bash
pnpm add zustand-lite
# или
npm install zustand-lite
# или
yarn add zustand-lite
```

## Быстрый старт

```typescript
import { create } from 'zustand-lite'

// Создание store
const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}))

// Использование в компоненте
function Counter() {
  const count = useStore((state) => state.count)
  const increment = useStore((state) => state.increment)

  return (
    <button onClick={increment}>
      Счётчик: {count}
    </button>
  )
}
```

## API Reference

### create

Создаёт React store с хуком для использования в компонентах.

```typescript
import { create } from 'zustand-lite'

interface State {
  count: number
  increment: () => void
}

const useStore = create<State>()((set, get, api) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
}))
```

**Параметры set:**

- `set(partial)` — частичное обновление состояния
- `set(fn)` — функция `(state) => partialState`
- `set(partial, replace)` — `replace: true` заменяет состояние полностью

### createStore

Создаёт vanilla store (без React).

```typescript
import { createStore } from 'zustand-lite'

const store = createStore((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
}))

// API
store.getState()           // получить состояние
store.setState({ count: 5 }) // установить состояние
store.subscribe(listener)  // подписаться на изменения
store.destroy()            // очистить подписки
```

### shallow

Поверхностное сравнение для оптимизации селекторов.

```typescript
import { shallow } from 'zustand-lite'

// Без shallow — ре-рендер при любом изменении состояния
const { name, age } = useStore((s) => ({ name: s.name, age: s.age }))

// С shallow — ре-рендер только при изменении name или age
const { name, age } = useStore(
  (s) => ({ name: s.name, age: s.age }),
  shallow
)
```

## Middleware

### persist

Сохранение состояния в localStorage/sessionStorage.

```typescript
import { create } from 'zustand-lite'
import { persist } from 'zustand-lite/middleware'

const useStore = create(
  persist(
    (set) => ({
      cart: [],
      addItem: (item) => set((s) => ({ cart: [...s.cart, item] })),
    }),
    {
      name: 'cart-storage',     // ключ в storage
      storage: localStorage,    // по умолчанию localStorage
      partialize: (s) => ({ cart: s.cart }), // что сохранять
    }
  )
)

// API persist
useStore.persist.rehydrate()    // загрузить из storage
useStore.persist.hasHydrated()  // проверить статус
useStore.persist.clearStorage() // очистить storage
```

### devtools

Интеграция с Redux DevTools.

```typescript
import { create } from 'zustand-lite'
import { devtools } from 'zustand-lite/middleware'

const useStore = create(
  devtools(
    (set) => ({
      count: 0,
      increment: () => set(
        (s) => ({ count: s.count + 1 }),
        false,
        'increment' // название action
      ),
    }),
    { name: 'CounterStore' }
  )
)
```

### immer

Мутабельный синтаксис для иммутабельных обновлений.

```bash
# immer — опциональная зависимость
pnpm add immer
```

```typescript
import { create } from 'zustand-lite'
import { immer } from 'zustand-lite/middleware'

const useStore = create(
  immer((set) => ({
    todos: [],
    addTodo: (text) => set((draft) => {
      // Мутабельный синтаксис!
      draft.todos.push({ id: Date.now(), text, done: false })
    }),
    toggleTodo: (id) => set((draft) => {
      const todo = draft.todos.find((t) => t.id === id)
      if (todo) todo.done = !todo.done
    }),
  }))
)
```

### subscribeWithSelector

Подписка на конкретные части состояния.

```typescript
import { create } from 'zustand-lite'
import { subscribeWithSelector } from 'zustand-lite/middleware'

const useStore = create(
  subscribeWithSelector((set) => ({
    count: 0,
    name: 'User',
    increment: () => set((s) => ({ count: s.count + 1 })),
  }))
)

// Подписка на изменение count
useStore.subscribe(
  (state) => state.count,
  (count, prevCount) => {
    console.log('count изменился:', prevCount, '→', count)
  }
)
```

### combine

Объединение начального состояния и действий.

```typescript
import { create } from 'zustand-lite'
import { combine } from 'zustand-lite/middleware'

const useStore = create(
  combine(
    // Начальное состояние
    { count: 0, name: 'Counter' },
    // Действия
    (set, get) => ({
      increment: () => set((s) => ({ count: s.count + 1 })),
      getName: () => get().name,
    })
  )
)
```

### Композиция middleware

```typescript
import { create } from 'zustand-lite'
import { devtools, persist, immer } from 'zustand-lite/middleware'

const useStore = create(
  devtools(
    persist(
      immer((set) => ({
        // ...
      })),
      { name: 'storage-key' }
    ),
    { name: 'StoreName' }
  )
)
```

## SSR

### Проблема

При SSR состояние на сервере и клиенте может отличаться (hydration mismatch).

### Решение: skipHydration

```typescript
import { create } from 'zustand-lite'
import { persist } from 'zustand-lite/middleware'

const useStore = create(
  persist(
    (set) => ({ cart: [] }),
    {
      name: 'cart',
      skipHydration: true, // Отключить авто-гидратацию
    }
  )
)

// Гидратация на клиенте
'use client'
import { useEffect } from 'react'

function CartProvider({ children }) {
  useEffect(() => {
    useStore.persist.rehydrate()
  }, [])
  return children
}
```

### useHydration

```typescript
import { useHydration } from 'zustand-lite/ssr'

function Cart() {
  const isHydrated = useHydration(useStore)

  if (!isHydrated) {
    return <CartSkeleton />
  }

  return <CartContent />
}
```

### HydrationBoundary

```typescript
import { HydrationBoundary } from 'zustand-lite/ssr'

function Cart() {
  return (
    <HydrationBoundary store={useCartStore} fallback={<CartSkeleton />}>
      <CartContent />
    </HydrationBoundary>
  )
}
```

### createStoreContext

Для изоляции состояния между запросами.

```typescript
import { createStoreContext } from 'zustand-lite/ssr'
import { createStore } from 'zustand-lite'

const { StoreProvider, useStoreContext } = createStoreContext(() =>
  createStore((set) => ({
    user: null,
    setUser: (user) => set({ user }),
  }))
)

// В layout
export default function Layout({ children }) {
  return <StoreProvider>{children}</StoreProvider>
}

// В компоненте
function UserProfile() {
  const user = useStoreContext((s) => s.user)
  return <div>{user?.name}</div>
}
```

## TypeScript

### Типизация store

```typescript
interface CounterState {
  count: number
  increment: () => void
  decrement: () => void
}

const useStore = create<CounterState>()((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
  decrement: () => set((s) => ({ count: s.count - 1 })),
}))
```

### Типизация с middleware

```typescript
import { StateCreator } from 'zustand-lite'

interface State {
  count: number
  increment: () => void
}

const createState: StateCreator<State> = (set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
})

const useStore = create<State>()(
  devtools(persist(createState, { name: 'store' }))
)
```

## Тестирование

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { createStore } from 'zustand-lite'

const createCounterStore = () =>
  createStore((set) => ({
    count: 0,
    increment: () => set((s) => ({ count: s.count + 1 })),
  }))

describe('CounterStore', () => {
  let store: ReturnType<typeof createCounterStore>

  beforeEach(() => {
    store = createCounterStore()
  })

  it('should increment', () => {
    store.getState().increment()
    expect(store.getState().count).toBe(1)
  })
})
```

## Лицензия

MIT
