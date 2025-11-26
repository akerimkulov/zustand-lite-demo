# CLAUDE.md - Project Guide

## Project Overview

**zustand-lite** - A lightweight state management library for React, inspired by Zustand. Built with TypeScript, SOLID
principles, and clean code practices.

This is a monorepo containing:

- `packages/zustand-lite` - The state management library
- `apps/demo` - Next.js demo application showcasing the library

## Quick Commands

```bash
# Install dependencies
pnpm install

# Development
pnpm dev              # Run demo app in dev mode
pnpm build            # Build all packages
pnpm build:lib        # Build library only
pnpm test             # Run unit tests
pnpm test:watch       # Run tests in watch mode
pnpm test:coverage    # Run tests with coverage (100% threshold)
pnpm test:e2e         # Run E2E tests (Playwright)
pnpm test:e2e:ui      # Run E2E tests with UI
pnpm lint             # Lint all packages
pnpm typecheck        # TypeScript type checking
pnpm format           # Format code with Prettier
pnpm clean            # Clean build artifacts

# Package-specific
pnpm --filter zustand-lite build    # Build library only
pnpm --filter demo dev              # Run demo only
pnpm --filter zustand-lite test     # Test library only
```

## Project Structure

```
state_management_library/
├── packages/
│   └── zustand-lite/           # Core library
│       └── src/
│           ├── types.ts        # Core type definitions
│           ├── vanilla.ts      # Framework-agnostic store
│           ├── react.ts        # React bindings (create, useStore)
│           ├── index.ts        # Main exports
│           ├── utils/
│           │   └── shallow.ts  # Shallow equality comparison
│           ├── middleware/     # Composable middleware
│           │   ├── index.ts    # Barrel export
│           │   ├── persist.ts
│           │   ├── devtools.ts
│           │   ├── immer.ts
│           │   ├── combine.ts
│           │   └── subscribeWithSelector.ts
│           └── ssr/            # SSR support
│               ├── index.ts    # Barrel export
│               ├── context.tsx
│               └── hydration.tsx
│
├── apps/
│   └── demo/                   # Next.js demo application
│       └── src/
│           ├── app/            # Next.js App Router pages
│           │   ├── page.tsx           # Home page
│           │   ├── layout.tsx         # Root layout
│           │   ├── demo/page.tsx      # E-commerce cart demo
│           │   ├── examples/page.tsx  # Code examples
│           │   ├── docs/              # Documentation section
│           │   │   ├── page.tsx
│           │   │   ├── layout.tsx
│           │   │   ├── installation/
│           │   │   ├── quick-start/
│           │   │   ├── testing/
│           │   │   ├── ssr/
│           │   │   ├── api/           # API reference
│           │   │   └── middleware/    # Middleware docs
│           │   └── principles/solid/  # SOLID principles
│           ├── components/     # React components
│           │   └── docs/       # Documentation components
│           ├── stores/         # Store definitions
│           └── data/           # Mock data
│
├── e2e/                        # E2E tests (Playwright)
│   ├── cart.spec.ts
│   ├── docs.spec.ts
│   ├── navigation.spec.ts
│   ├── persistence.spec.ts
│   └── theme.spec.ts
│
├── playwright.config.ts        # E2E test configuration
└── TESTING.md                  # Testing documentation
```

## Architecture

### Core Library Design

The library follows **SOLID principles**:

1. **Single Responsibility**: Each module handles one task
    - `vanilla.ts` - Store creation only
    - `react.ts` - React bindings only
    - Each middleware file - One middleware only

2. **Open/Closed**: Core is closed for modification, open for extension via middleware

3. **Liskov Substitution**: All stores implement `StoreApi<T>` interface

4. **Interface Segregation**: Small, focused interfaces (StoreApi, PersistApi, etc.)

5. **Dependency Inversion**: Abstractions over implementations (Storage interface)

### Key Patterns

**Store Creation (Curried API for Type Inference)**:

```typescript
// The double function call enables proper type inference
const useStore = create<State>()((set, get, api) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
}))
```

**Middleware Composition**:

```typescript
// Middleware wraps StateCreator, enabling composition
const useStore = create<State>()(
  devtools(
    persist(
      (set) => ({ ... }),
      { name: 'storage-key' }
    )
  )
)
```

**SSR Hydration Pattern**:

```typescript
// Use skipHydration to prevent hydration mismatch
const useStore = create<State>()(
  persist(
    (set) => ({ ... }),
    { name: 'key', skipHydration: true }
  )
)

// Rehydrate in useEffect
useEffect(() => {
  useStore.persist.rehydrate()
}, [])
```

## Type System

### Core Types

- `StoreApi<T>` - Store interface (getState, setState, subscribe, destroy)
- `StateCreator<T, Mis, Mos, U>` - Function that creates initial state
- `StoreMutators` - Type registry for middleware type transformations
- `Mutate<S, Ms>` - Applies middleware type mutations to store

### Middleware Type Pattern

Each middleware extends the store type:

```typescript
// persist adds .persist property
type WithPersist<T> = {
  persist: {
    rehydrate: () => Promise<void>
    hasHydrated: () => boolean
    // ...
  }
}
```

## Demo Application

The Next.js demo showcases:

1. **E-commerce Cart** (`/demo`)
    - Add/remove products
    - Persistent cart (localStorage)
    - Real-time state inspector
    - DevTools integration

2. **Code Examples** (`/examples`)
    - Basic usage
    - All middleware examples
    - Interactive live demos

3. **Documentation** (`/docs`)
    - Installation guide
    - Quick start tutorial
    - API reference (create, createStore, useStore, shallow)
    - Middleware documentation (persist, devtools, immer, combine, subscribeWithSelector)
    - SSR guide
    - Testing guide

4. **SOLID Principles** (`/principles/solid`)
    - Visual explanation of each principle
    - Code examples from the library

## Development Notes

- Uses **pnpm workspaces** for monorepo management
- **TypeScript strict mode** enabled
- React 18's **useSyncExternalStore** for concurrent rendering support
- **Vitest** for unit/integration testing (100% coverage threshold)
- **Playwright** for E2E testing
- **Tailwind CSS** for demo styling

## Testing

### Unit/Integration Tests (Vitest)

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage (100% threshold required)
pnpm test:coverage
```

### E2E Tests (Playwright)

```bash
# Run E2E tests
pnpm test:e2e

# Run E2E tests with UI
pnpm test:e2e:ui
```

## Building

```bash
# Build library for production
pnpm --filter zustand-lite build

# Build demo for production
pnpm --filter demo build
```

## Dependencies

### Library (zustand-lite)

- No runtime dependencies (except peer deps: react)
- Optional: immer (for immer middleware)

### Demo App

- Next.js 14
- Tailwind CSS
- Framer Motion
- Lucide React (icons)
- react-syntax-highlighter
