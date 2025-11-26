# zustand-lite

Легковесная библиотека управления состоянием для React, вдохновлённая [Zustand](https://github.com/pmndrs/zustand).

## Особенности

- **Минималистичный размер** — менее 1KB (gzipped)
- **TypeScript-first** — полная типизация из коробки
- **Middleware система** — persist, devtools, immer и другие
- **SSR поддержка** — готово для Next.js и других SSR-фреймворков
- **SOLID принципы** — чистая архитектура

## Структура проекта

```
state_management_library/
├── packages/
│   └── zustand-lite/     # Основная библиотека
├── apps/
│   └── demo/             # Демо-приложение (Next.js)
├── e2e/                  # E2E тесты (Playwright)
├── TESTING.md            # Документация по тестированию
└── playwright.config.ts  # Конфигурация E2E тестов
```

## Быстрый старт

```bash
# Установка зависимостей
pnpm install

# Запуск демо-приложения
pnpm dev

# Сборка всех пакетов
pnpm build

# Запуск тестов
pnpm test
```

## Команды

| Команда              | Описание                                   |
|----------------------|--------------------------------------------|
| `pnpm dev`           | Запуск демо-приложения в режиме разработки |
| `pnpm build`         | Сборка всех пакетов                        |
| `pnpm build:lib`     | Сборка только библиотеки                   |
| `pnpm test`          | Запуск unit-тестов                         |
| `pnpm test:watch`    | Тесты в режиме watch                       |
| `pnpm test:coverage` | Тесты с отчётом покрытия                   |
| `pnpm test:e2e`      | Запуск E2E тестов (Playwright)             |
| `pnpm test:e2e:ui`   | E2E тесты с UI                             |
| `pnpm lint`          | Проверка кода линтером                     |
| `pnpm typecheck`     | Проверка типов TypeScript                  |
| `pnpm format`        | Форматирование кода (Prettier)             |
| `pnpm clean`         | Очистка build артефактов                   |

### Команды для отдельных пакетов

```bash
# Только библиотека
pnpm --filter zustand-lite build
pnpm --filter zustand-lite test

# Только демо
pnpm --filter demo dev
pnpm --filter demo build
```

## Быстрый пример

```typescript
import { create } from 'zustand-lite'

const useStore = create((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
  decrement: () => set((s) => ({ count: s.count - 1 })),
}))

function Counter() {
  const count = useStore((s) => s.count)
  const increment = useStore((s) => s.increment)

  return (
    <button onClick={increment}>
      Счётчик: {count}
    </button>
  )
}
```

## Документация

- [Документация библиотеки](./packages/zustand-lite/README.md)
- [Демо-приложение](./apps/demo)

## Технологии

- **pnpm** — менеджер пакетов
- **TypeScript** — типизация
- **Vitest** — unit/integration тестирование
- **Playwright** — E2E тестирование
- **Next.js** — демо-приложение
- **Tailwind CSS** — стили демо

## Лицензия

MIT
