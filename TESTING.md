# Тестирование zustand-lite

Руководство по тестированию библиотеки zustand-lite.

## Содержание

- [Обзор](#обзор)
- [Быстрый старт](#быстрый-старт)
- [Виды тестов](#виды-тестов)
- [Покрытие кода](#покрытие-кода)
- [Структура файлов тестов](#структура-файлов-тестов)
- [Примеры написания тестов](#примеры-написания-тестов)
- [Паттерны тестирования](#паттерны-тестирования)
- [Конфигурация](#конфигурация)
- [Troubleshooting](#troubleshooting)
- [CI/CD интеграция](#cicd-интеграция)

---

## Обзор

Проект использует многоуровневую стратегию тестирования:

| Уровень     | Фреймворк  | Описание                                |
|-------------|------------|-----------------------------------------|
| Unit        | Vitest     | Тестирование отдельных модулей          |
| Integration | Vitest     | Тестирование взаимодействия компонентов |
| E2E         | Playwright | Сквозное тестирование приложения        |

### Технологический стек

- **Vitest** — быстрый test runner, совместимый с Jest API
- **Playwright** — браузерная автоматизация для E2E
- **happy-dom** — легковесная DOM-имплементация (быстрее jsdom)
- **@testing-library/react** — утилиты для тестирования React

---

## Быстрый старт

### Запуск всех тестов

```bash
# Запуск unit и integration тестов
pnpm test

# Запуск в watch режиме (пересборка при изменениях)
pnpm test:watch

# Запуск с отчётом о покрытии
pnpm --filter zustand-lite test:coverage

# Запуск E2E тестов
pnpm test:e2e

# E2E с графическим интерфейсом
pnpm test:e2e:ui
```

### Запуск тестов конкретного пакета

```bash
# Только библиотека
pnpm --filter zustand-lite test
pnpm --filter zustand-lite test:watch
pnpm --filter zustand-lite test:coverage
```

### Запуск конкретного файла

```bash
# Один файл
pnpm --filter zustand-lite test -- --run tests/vanilla.test.ts

# Файлы по паттерну
pnpm --filter zustand-lite test -- --run tests/middleware/*.test.ts
```

---

## Виды тестов

### 1. Unit тесты

**Назначение:** Тестирование отдельных модулей в изоляции.

**Что тестируется:**

- Создание store (`createStore`)
- React bindings (`create`, `useStore`)
- Утилиты (`shallow`)
- Каждый middleware отдельно
- SSR компоненты

**Файлы:**
| Файл | Описание | Тестов |
|------|----------|--------|
| `vanilla.test.ts` | Ядро store (getState, setState, subscribe) | 64 |
| `react.test.tsx` | React хуки и bindings | 43 |
| `shallow.test.ts` | Shallow comparison | ~20 |
| `middleware/persist.test.ts` | Персистентность состояния | 69 |
| `middleware/devtools.test.ts` | Интеграция с Redux DevTools | ~30 |
| `middleware/immer.test.ts` | Immutable обновления | ~15 |
| `middleware/combine.test.ts` | Композиция stores | ~10 |
| `middleware/subscribeWithSelector.test.ts` | Селективные подписки | ~15 |
| `ssr/context.test.tsx` | SSR контекст | 17 |
| `ssr/hydration.test.tsx` | Гидрация состояния | 18 |

### 2. Integration тесты

**Назначение:** Проверка взаимодействия нескольких компонентов системы.

**Что тестируется:**

- Композиция middleware
- React хуки с селекторами
- Реальные сценарии использования

**Файлы:**
| Файл | Описание |
|------|----------|
| `middleware-composition.test.ts` | Комбинации middleware (persist + devtools + immer) |
| `react-integration.test.tsx` | React компоненты с store |
| `real-world-scenarios.test.tsx` | Корзина покупок, формы, загрузка данных |

### 3. E2E тесты

**Назначение:** Сквозное тестирование приложения в реальном браузере.

**Что тестируется:**

- Пользовательские сценарии
- Навигация
- Персистентность между перезагрузками
- Responsive дизайн

**Файлы:**
| Файл | Описание |
|------|----------|
| `cart.spec.ts` | Корзина покупок |
| `examples.spec.ts` | Страница примеров кода |
| `docs.spec.ts` | Документация |
| `responsive.spec.ts` | Адаптивность |
| `state-inspector.spec.ts` | Инспектор состояния |
| `persistence.spec.ts` | Сохранение в localStorage |
| `theme.spec.ts` | Переключение темы |
| `navigation.spec.ts` | Навигация между страницами |

---

## Покрытие кода

### Текущие метрики

| Метрика    | Покрытие | Требование |
|------------|----------|------------|
| Statements | 99.9%    | 100%       |
| Branches   | 98.06%   | 100%       |
| Functions  | 100%     | 100%       |
| Lines      | 99.9%    | 100%       |

### Генерация отчёта

```bash
# Текстовый отчёт в консоли
pnpm --filter zustand-lite test:coverage

# HTML отчёт (открыть в браузере)
pnpm --filter zustand-lite test:coverage
open packages/zustand-lite/coverage/index.html
```

### Требования к покрытию

Проект требует **100% покрытия** по всем метрикам. Конфигурация:

```typescript
// vitest.config.ts
coverage: {
  thresholds: {
    lines: 100,
    functions: 100,
    branches: 100,
    statements: 100,
  },
}
```

При недостаточном покрытии тесты завершатся с ошибкой.

---

## Структура файлов тестов

```
packages/zustand-lite/
├── tests/
│   ├── setup.ts                    # Глобальная настройка тестов
│   ├── vanilla.test.ts             # Тесты vanilla store
│   ├── react.test.tsx              # Тесты React bindings
│   ├── shallow.test.ts             # Тесты shallow utility
│   │
│   ├── middleware/                 # Тесты middleware
│   │   ├── persist.test.ts
│   │   ├── devtools.test.ts
│   │   ├── immer.test.ts
│   │   ├── combine.test.ts
│   │   └── subscribeWithSelector.test.ts
│   │
│   ├── ssr/                        # Тесты SSR
│   │   ├── context.test.tsx
│   │   └── hydration.test.tsx
│   │
│   └── integration/                # Интеграционные тесты
│       ├── middleware-composition.test.ts
│       ├── react-integration.test.tsx
│       └── real-world-scenarios.test.tsx
│
└── vitest.config.ts                # Конфигурация Vitest

e2e/                                # E2E тесты (Playwright)
├── cart.spec.ts
├── examples.spec.ts
├── docs.spec.ts
├── responsive.spec.ts
├── state-inspector.spec.ts
├── persistence.spec.ts
├── theme.spec.ts
└── navigation.spec.ts

playwright.config.ts                # Конфигурация Playwright
```

---

## Примеры написания тестов

### Unit тест: Vanilla Store

```typescript
import { describe, it, expect, vi } from 'vitest'
import { createStore } from '../src/vanilla'

describe('vanilla store', () => {
  describe('createStore', () => {
    it('creates store with initializer function', () => {
      const store = createStore(() => ({ count: 0 }))

      expect(store).toBeDefined()
      expect(store.getState).toBeDefined()
      expect(store.setState).toBeDefined()
      expect(store.subscribe).toBeDefined()
    })

    it('passes set, get, api to initializer', () => {
      const initializer = vi.fn((set, get, api) => {
        expect(typeof set).toBe('function')
        expect(typeof get).toBe('function')
        expect(api).toHaveProperty('getState')
        return { count: 0 }
      })

      createStore(initializer)
      expect(initializer).toHaveBeenCalledTimes(1)
    })
  })

  describe('setState', () => {
    it('updates state with partial object', () => {
      const store = createStore(() => ({ count: 0, name: 'test' }))
      store.setState({ count: 5 })
      expect(store.getState()).toEqual({ count: 5, name: 'test' })
    })

    it('updates state with updater function', () => {
      const store = createStore(() => ({ count: 0 }))
      store.setState((state) => ({ count: state.count + 1 }))
      expect(store.getState().count).toBe(1)
    })
  })

  describe('subscribe', () => {
    it('calls listener on state change', () => {
      const store = createStore(() => ({ count: 0 }))
      const listener = vi.fn()

      store.subscribe(listener)
      store.setState({ count: 1 })

      expect(listener).toHaveBeenCalledWith({ count: 1 }, { count: 0 })
    })

    it('returns unsubscribe function', () => {
      const store = createStore(() => ({ count: 0 }))
      const listener = vi.fn()

      const unsubscribe = store.subscribe(listener)
      unsubscribe()
      store.setState({ count: 1 })

      expect(listener).not.toHaveBeenCalled()
    })
  })
})
```

### Unit тест: Middleware (persist)

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createStore } from '../../src/vanilla'
import { persist, createJSONStorage } from '../../src/middleware/persist'

// Интерфейс тестового состояния
interface TestState {
  count: number
  increment: () => void
}

// Хелпер для создания mock storage
const createMockStorage = () => {
  const data = new Map<string, string>()
  return {
    getItem: vi.fn((key: string) => data.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => data.set(key, value)),
    removeItem: vi.fn((key: string) => data.delete(key)),
  }
}

describe('persist middleware', () => {
  let mockStorage: ReturnType<typeof createMockStorage>

  beforeEach(() => {
    mockStorage = createMockStorage()
  })

  it('persists state to storage', async () => {
    const store = createStore<TestState>()(
      persist(
        (set) => ({
          count: 0,
          increment: () => set((s) => ({ count: s.count + 1 })),
        }),
        {
          name: 'test-store',
          storage: createJSONStorage(() => mockStorage),
        }
      )
    )

    store.getState().increment()

    // Ждём debounce записи
    await new Promise((r) => setTimeout(r, 100))

    expect(mockStorage.setItem).toHaveBeenCalled()
  })

  it('rehydrates state from storage', async () => {
    // Предварительно записываем данные
    mockStorage.setItem(
      'test-store',
      JSON.stringify({ state: { count: 42 }, version: 0 })
    )

    const store = createStore<TestState>()(
      persist(
        (set) => ({
          count: 0,
          increment: () => set((s) => ({ count: s.count + 1 })),
        }),
        {
          name: 'test-store',
          storage: createJSONStorage(() => mockStorage),
        }
      )
    )

    await store.persist.rehydrate()
    expect(store.getState().count).toBe(42)
  })
})
```

### Unit тест: React компонент

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { create } from '../../src/react'

interface CounterState {
  count: number
  increment: () => void
}

const useCounterStore = create<CounterState>()((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
}))

function Counter() {
  const count = useCounterStore((s) => s.count)
  const increment = useCounterStore((s) => s.increment)

  return (
    <div>
      <span data-testid="count">{count}</span>
      <button onClick={increment}>Увеличить</button>
    </div>
  )
}

describe('React integration', () => {
  it('renders initial state', () => {
    render(<Counter />)
    expect(screen.getByTestId('count')).toHaveTextContent('0')
  })

  it('updates on state change', () => {
    render(<Counter />)

    fireEvent.click(screen.getByText('Увеличить'))

    expect(screen.getByTestId('count')).toHaveTextContent('1')
  })
})
```

### E2E тест: Playwright

```typescript
import { test, expect } from '@playwright/test'

test.describe('Shopping Cart', () => {
  test('displays products on demo page', async ({ page }) => {
    await page.goto('/demo')

    // Ждём загрузки продуктов
    await expect(page.getByRole('heading', { name: 'Товары' })).toBeVisible()

    // Проверяем наличие кнопок добавления
    const addButtons = page.getByRole('button', { name: /Добавить/i })
    await expect(addButtons.first()).toBeVisible()
  })

  test('adds item to cart', async ({ page }) => {
    await page.goto('/demo')

    // Добавляем товар
    const addButton = page.getByRole('button', { name: /Добавить/i }).first()
    await addButton.click()

    // Проверяем счётчик корзины
    const cartBadge = page.getByTestId('cart-badge')
    await expect(cartBadge).toHaveText('1')
  })

  test('persists cart across page reload', async ({ page }) => {
    await page.goto('/demo')

    // Добавляем товар
    await page.getByRole('button', { name: /Добавить/i }).first().click()

    // Перезагружаем страницу
    await page.reload()

    // Проверяем, что товар остался
    const cartBadge = page.getByTestId('cart-badge')
    await expect(cartBadge).toHaveText('1')
  })
})
```

---

## Паттерны тестирования

### Организация тестов

```typescript
describe('ModuleName', () => {
  // Группировка по методам/функционалу
  describe('methodName', () => {
    it('does something specific', () => {
      // Arrange
      const input = createInput()

      // Act
      const result = methodName(input)

      // Assert
      expect(result).toBe(expected)
    })
  })
})
```

### Моки и спаи

```typescript
import { vi } from 'vitest'

// Мок функции
const mockFn = vi.fn()
mockFn.mockReturnValue('value')
mockFn.mockImplementation(() => 'value')

// Спай на объекте
const spy = vi.spyOn(object, 'method')
spy.mockReturnValue('mocked')

// Проверка вызовов
expect(mockFn).toHaveBeenCalled()
expect(mockFn).toHaveBeenCalledWith('arg')
expect(mockFn).toHaveBeenCalledTimes(2)
```

### Тестирование асинхронного кода

```typescript
// Async/await
it('handles async operations', async () => {
  const result = await asyncFunction()
  expect(result).toBe('expected')
})

// Fake timers
it('handles debounce', async () => {
  vi.useFakeTimers()

  const store = createStore(/* ... */)
  store.setState({ count: 1 })

  vi.advanceTimersByTime(1000) // Продвигаем время

  expect(/* ... */).toBe(/* ... */)

  vi.useRealTimers()
})

// Ожидание с waitFor
import { waitFor } from '@testing-library/react'

it('waits for condition', async () => {
  await waitFor(() => {
    expect(element).toBeVisible()
  })
})
```

### Тестирование ошибок

```typescript
// Синхронная ошибка
it('throws error on invalid input', () => {
  expect(() => {
    functionThatThrows()
  }).toThrow('Error message')
})

// Асинхронная ошибка
it('rejects with error', async () => {
  await expect(asyncFunctionThatRejects()).rejects.toThrow('Error')
})

// React Error Boundary
it('handles component error', () => {
  // Ожидается ошибка в консоли
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

  expect(() => {
    render(<ComponentThatThrows />)
  }).toThrow()

  spy.mockRestore()
})
```

---

## Конфигурация

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // DOM окружение (быстрее jsdom)
    environment: 'happy-dom',

    // Глобальные expect, describe, it без импортов
    globals: true,

    // Паттерн файлов тестов
    include: ['tests/**/*.test.{ts,tsx}'],

    // Файл настройки (моки, cleanup)
    setupFiles: ['./tests/setup.ts'],

    // Настройки покрытия
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.d.ts', 'src/**/index.ts'],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
})
```

### playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  // Директория с тестами
  testDir: './e2e',

  // Параллельный запуск
  fullyParallel: true,

  // Запретить .only в CI
  forbidOnly: !!process.env.CI,

  // Повторные попытки при падении
  retries: process.env.CI ? 2 : 0,

  // Количество воркеров
  workers: process.env.CI ? 1 : undefined,

  // Формат отчёта
  reporter: 'list',

  use: {
    // Базовый URL приложения
    baseURL: 'http://localhost:3000',

    // Трейсы при первом ретрае
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Автозапуск dev сервера
  webServer: {
    command: 'pnpm --filter demo dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
```

### tests/setup.ts

```typescript
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

// Cleanup React после каждого теста
afterEach(() => {
  cleanup()
})

// Мок localStorage
const createMockStorage = () => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
}

Object.defineProperty(window, 'localStorage', {
  value: createMockStorage(),
})

// Сброс перед каждым тестом
beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})

// Хелперы для таймеров
export const waitFor = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms))

export const flushTimers = () => vi.runAllTimers()
export const advanceTimers = (ms: number) => vi.advanceTimersByTime(ms)
```

---

## Troubleshooting

### Тест падает с "act() warning"

**Проблема:** React предупреждает о необёрнутых обновлениях состояния.

**Решение:**

```typescript
import { act } from '@testing-library/react'

await act(async () => {
  store.setState({ count: 1 })
})
```

### Тест падает с таймаутом

**Проблема:** Асинхронная операция не завершается.

**Решение:**

```typescript
// Увеличить таймаут теста
it('slow test', async () => {
  // ...
}, 10000) // 10 секунд

// Или использовать fake timers
vi.useFakeTimers()
vi.advanceTimersByTime(5000)
vi.useRealTimers()
```

### localStorage не работает в тестах

**Проблема:** localStorage undefined или не сохраняет данные.

**Решение:** Убедитесь, что `tests/setup.ts` подключен в `vitest.config.ts`:

```typescript
setupFiles: ['./tests/setup.ts']
```

### E2E тест не находит элемент

**Проблема:** `locator.click: Target closed` или элемент не найден.

**Решение:**

```typescript
// Ждать появления элемента
await expect(page.getByText('Text')).toBeVisible()

// Использовать более надёжный локатор
page.getByRole('button', { name: 'Submit' })
page.getByTestId('submit-button')
```

### Покрытие не достигает 100%

**Проблема:** Тесты проходят, но coverage threshold не пройден.

**Решение:**

1. Запустите `pnpm --filter zustand-lite test:coverage` и найдите непокрытые строки
2. В HTML отчёте (`coverage/index.html`) кликните на файл
3. Красные строки — непокрытый код
4. Добавьте тесты для этих cases

---

## CI/CD интеграция

### GitHub Actions пример

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install

      - name: Run unit tests
        run: pnpm --filter zustand-lite test:coverage

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: pnpm test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./packages/zustand-lite/coverage/coverage-final.json
```

### Особенности CI

- **Параллелизация:** В CI используется 1 воркер для стабильности
- **Ретраи:** E2E тесты повторяются 2 раза при падении
- **Трейсы:** Сохраняются при первом ретрае для отладки
- **Кеширование:** pnpm кеширует зависимости между запусками

---

## Статистика

| Метрика          | Значение                    |
|------------------|-----------------------------|
| Всего тестов     | 459 (unit/integration)      |
| Тестовых файлов  | 21                          |
| Время выполнения | ~1.5 сек (unit/integration) |
| Покрытие кода    | ~99%                        |
| E2E сценариев    | 8 файлов                    |
