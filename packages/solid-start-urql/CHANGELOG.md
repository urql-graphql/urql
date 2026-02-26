# @urql/solid-start

## 0.2.0

### Minor Changes

- Fix SSR runtime failures caused by importing SolidStart's `action` API at module load time by reading `action` from `Provider` context instead
  Submitted by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#3850](https://github.com/urql-graphql/urql/pull/3850))

### Patch Changes

- ⚠️ Fix `createSubscription` to use `@urql/solid-start` context instead of re-exporting the Solid-only implementation from `@urql/solid`
  Submitted by [@JoviDeCroock](https://github.com/JoviDeCroock) (See [#3850](https://github.com/urql-graphql/urql/pull/3850))

## 0.1.0

### Minor Changes

- Initial release of `@urql/solid-start` - URQL integration built with SolidStart's native primitives.
  Get started with:
  - **`createQuery`** - GraphQL queries using SolidStart's `query()` and `createAsync()`
  - **`createMutation`** - GraphQL mutations using SolidStart's `action()` and `useAction()`
  - **`createSubscription`** - Real-time GraphQL subscriptions
  - **`Provider`** and **`useClient`** - Context-based client access
  - **Reactive variables** - All parameters accept signals/accessors for automatic re-execution
  - **Full SSR support** - Works seamlessly with SolidStart's server-side rendering
  - **TypeScript support** - Complete type safety with GraphQL types
  - **Uses `@solid-primitives/utils`** - Leverages standard Solid ecosystem utilities
    Submitted by [@davedbase](https://github.com/davedbase) (See [#3837](https://github.com/urql-graphql/urql/pull/3837))

### Patch Changes

- Updated dependencies (See [#3837](https://github.com/urql-graphql/urql/pull/3837))
  - @urql/solid@1.0.1
