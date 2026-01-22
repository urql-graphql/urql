---
'@urql/solid-start': minor
---

Initial release of `@urql/solid-start` - URQL integration built with SolidStart's native primitives.

### Features

- **`createQuery`** - GraphQL queries using SolidStart's `query()` and `createAsync()`
- **`createMutation`** - GraphQL mutations using SolidStart's `action()` and `useAction()`
- **`createSubscription`** - Real-time GraphQL subscriptions
- **`Provider`** and **`useClient`** - Context-based client access
- **Reactive variables** - All parameters accept signals/accessors for automatic re-execution
- **Full SSR support** - Works seamlessly with SolidStart's server-side rendering
- **TypeScript support** - Complete type safety with GraphQL types
- **Uses `@solid-primitives/utils`** - Leverages standard Solid ecosystem utilities
