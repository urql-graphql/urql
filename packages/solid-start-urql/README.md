# @urql/solid-start

`@urql/solid-start` provides URQL integration for [SolidStart](https://start.solidjs.com/), built with SolidStart's native primitives like `query`, `action`, and `createAsync`.

## Features

- 🎯 **SolidStart Native** - Built with `query`, `action`, `createAsync`, and `useAction`
- 🚀 **Automatic SSR** - Works seamlessly with SolidStart's server-side rendering
- 🔄 **Reactive Variables** - Query variables can be signals that automatically trigger re-execution
- 📡 **Real-time Subscriptions** - Full GraphQL subscription support
- 🎨 **Type Safe** - Complete TypeScript support with GraphQL types
- 🪶 **Lightweight** - Minimal wrapper over URQL core

## Installation

```bash
npm install @urql/solid-start @urql/solid @urql/core graphql
# or
pnpm add @urql/solid-start @urql/solid @urql/core graphql
# or
yarn add @urql/solid-start @urql/solid @urql/core graphql
```

> **Note:** `@urql/solid` is a peer dependency required for subscriptions.

## Quick Start

### 1. Set up the Provider

Wrap your app with the `Provider` to make the URQL client available:

```tsx
// src/app.tsx
import { Router } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import { Provider } from '@urql/solid-start';
import { createClient, cacheExchange, fetchExchange } from '@urql/core';

const client = createClient({
  url: 'https://api.example.com/graphql',
  exchanges: [cacheExchange, fetchExchange],
});

export default function App() {
  return (
    <Router
      root={props => (
        <Provider value={client}>
          {props.children}
        </Provider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
```

### 2. Use Queries

```tsx
// src/routes/todos.tsx
import { createQuery } from '@urql/solid-start';
import { gql } from '@urql/core';
import { For, Show, Suspense } from 'solid-js';
import { type RouteDefinition } from '@solidjs/router';

const TodosQuery = gql`
  query {
    todos {
      id
      title
      completed
    }
  }
`;

// Preload the query before the route renders (recommended)
export const route = {
  preload: () => {
    const todos = createQuery({ query: TodosQuery });
    return todos(); // Start fetching
  },
} satisfies RouteDefinition;

export default function TodosPage() {
  const todos = createQuery({ query: TodosQuery });

  return (
    <div>
      <h1>Todos</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <Show when={todos()?.data}>
          <ul>
            <For each={todos()!.data.todos}>
              {todo => (
                <li>
                  <input type="checkbox" checked={todo.completed} />
                  {todo.title}
                </li>
              )}
            </For>
          </ul>
        </Show>
        <Show when={todos()?.error}>
          <p>Error: {todos()!.error.message}</p>
        </Show>
      </Suspense>
    </div>
  );
}
```

### 3. Use Mutations

```tsx
// src/components/AddTodoForm.tsx
import { createMutation } from '@urql/solid-start';
import { gql } from '@urql/core';
import { Show } from 'solid-js';

const AddTodoMutation = gql`
  mutation AddTodo($title: String!) {
    addTodo(title: $title) {
      id
      title
    }
  }
`;

export function AddTodoForm() {
  const [state, addTodo] = createMutation(AddTodoMutation);
  let inputRef: HTMLInputElement | undefined;

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!inputRef?.value) return;

    const result = await addTodo({ title: inputRef.value });
    if (result.data) {
      inputRef.value = '';
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input ref={inputRef} type="text" placeholder="New todo" />
      <button type="submit" disabled={state.fetching}>
        Add Todo
      </button>
      <Show when={state.error}>
        <p>Error: {state.error.message}</p>
      </Show>
    </form>
  );
}
```

### 4. Use Subscriptions

```tsx
// src/components/LiveMessages.tsx
import { createSubscription } from '@urql/solid-start';
import { gql } from '@urql/core';
import { For } from 'solid-js';

const MessagesSubscription = gql`
  subscription {
    messageAdded {
      id
      text
      createdAt
    }
  }
`;

export function LiveMessages() {
  const [messages] = createSubscription(
    { query: MessagesSubscription },
    // Optional handler to accumulate messages
    (prev = [], data) => [...prev, data.messageAdded]
  );

  return (
    <div>
      <h2>Live Messages</h2>
      <For each={messages.data}>
        {msg => <div>{msg.text}</div>}
      </For>
    </div>
  );
}
```

## API Reference

### `createQuery(args)`

Creates a GraphQL query using SolidStart's `query` and `createAsync` primitives.

**Args:**
```ts
{
  query: DocumentInput;           // GraphQL query document
  variables?: MaybeAccessor<Variables>;  // Static or reactive variables
  requestPolicy?: MaybeAccessor<RequestPolicy>;  // Cache policy
  context?: MaybeAccessor<Partial<OperationContext>>;  // Additional context
  pause?: MaybeAccessor<boolean>;  // Pause execution
  key?: string;  // Custom cache key for SolidStart's router
}
```

**Returns:** `Accessor<OperationResult | undefined>`

**Example with reactive variables:**
```tsx
import { createSignal } from 'solid-js';

const [userId, setUserId] = createSignal(1);

const user = createQuery({
  query: UserQuery,
  variables: () => ({ id: userId() }), // Re-runs when userId changes!
});
```

### `createMutation(mutation, key?)`

Creates a GraphQL mutation using SolidStart's `action` and `useAction` primitives.

**Args:**
- `mutation: DocumentInput` - GraphQL mutation document
- `key?: string` - Optional custom cache key for SolidStart's router

**Returns:** `[State, ExecuteFunction]`

**State:** Fine-grained reactive store
```ts
{
  data?: Data;
  error?: CombinedError;
  fetching: boolean;
}
```

**Example:**
```tsx
const [state, executeMutation] = createMutation(UpdateUserMutation);

// Call the mutation
const result = await executeMutation({ id: 1, name: 'Alice' });
```

### `createSubscription(args, handler?)`

Creates a GraphQL subscription for real-time updates.

**Args:**
```ts
{
  query: DocumentInput;
  variables?: MaybeAccessor<Variables>;
  context?: MaybeAccessor<Partial<OperationContext>>;
  pause?: MaybeAccessor<boolean>;
}
```

**Handler:** Optional function to accumulate/transform subscription data
```ts
(previousData: Data | undefined, newData: Data) => Data
```

**Returns:** `[State, ExecuteFunction]`

**Example with handler:**
```tsx
const [messages] = createSubscription(
  { query: MessagesSubscription },
  (prev = [], data) => [...prev, data.messageAdded]
);
```

### `Provider`

Context provider for the URQL client.

**Props:**
- `value: Client` - The URQL client instance

**Example:**
```tsx
import { Provider } from '@urql/solid-start';

<Provider value={client}>
  <App />
</Provider>
```

### `useClient()`

Hook to access the URQL client from context.

**Returns:** `Client`

## Request Policies

Control caching behavior with `requestPolicy`:

- `cache-first` (default) - Use cache if available, otherwise fetch
- `cache-only` - Only use cached data, never fetch
- `network-only` - Always fetch, ignore cache
- `cache-and-network` - Return cache immediately, then fetch in background

```tsx
const todos = createQuery({
  query: TodosQuery,
  requestPolicy: 'cache-and-network',
});
```

## Reactive Variables

All `MaybeAccessor` parameters accept either static values or Solid signals/accessors:

```tsx
import { createSignal } from 'solid-js';

const [searchTerm, setSearchTerm] = createSignal('');

// Query automatically re-executes when searchTerm changes
const results = createQuery({
  query: SearchQuery,
  variables: () => ({ term: searchTerm() }),
});
```

## Pausing Queries

Control when queries execute:

```tsx
const [isPaused, setIsPaused] = createSignal(true);

const data = createQuery({
  query: MyQuery,
  pause: isPaused, // Query only runs when false
});

// Start the query
setIsPaused(false);
```

## Custom Cache Keys

By default, queries and mutations use auto-generated cache keys. You can provide custom keys for better control:

```tsx
// Custom query key
const todos = createQuery({
  query: TodosQuery,
  key: 'my-todos', // Custom key instead of auto-generated
});

// Custom mutation key
const [state, addTodo] = createMutation(AddTodoMutation, 'add-todo');
```

Custom keys are useful when:
- You want predictable cache keys for debugging
- You need to coordinate caching with other SolidStart features
- You're implementing custom revalidation logic

## Route Preloading

Use SolidStart's `preload` to start fetching data before a route renders:

```tsx
import { type RouteDefinition } from '@solidjs/router';

const UserQuery = gql`
  query GetUser($id: ID!) {
    user(id: $id) { id name email }
  }
`;

// Preload with route parameters
export const route = {
  preload: ({ params }) => {
    const user = createQuery({
      query: UserQuery,
      variables: { id: params.id },
    });
    return user(); // Triggers the fetch
  },
} satisfies RouteDefinition;

export default function UserPage(props: { params: { id: string } }) {
  // This will use the preloaded data
  const user = createQuery({
    query: UserQuery,
    variables: { id: props.params.id },
  });

  return <div>{user()?.data?.user.name}</div>;
}
```

**Benefits of preloading:**
- ✅ Data starts fetching before the component renders
- ✅ Reduces time to first meaningful paint
- ✅ Works with SolidStart's router for parallel data fetching
- ✅ Automatic deduplication - same query won't fetch twice

## Advanced: Custom Exchanges

Add custom exchanges for authentication, error handling, etc:

```tsx
import { createClient, cacheExchange, fetchExchange } from '@urql/core';
import { authExchange } from '@urql/exchange-auth';

const client = createClient({
  url: 'https://api.example.com/graphql',
  exchanges: [
    cacheExchange,
    authExchange(async utils => {
      return {
        addAuthToOperation(operation) {
          const token = localStorage.getItem('token');
          if (!token) return operation;
          return utils.appendHeaders(operation, {
            Authorization: `Bearer ${token}`,
          });
        },
        didAuthError(error) {
          return error.graphQLErrors.some(
            e => e.extensions?.code === 'UNAUTHENTICATED'
          );
        },
        async refreshAuth() {
          // Refresh token logic
        },
      };
    }),
    fetchExchange,
  ],
});
```

## TypeScript

Full type safety with GraphQL types:

```tsx
import { createQuery } from '@urql/solid-start';
import { gql, type TypedDocumentNode } from '@urql/core';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
}

interface TodosData {
  todos: Todo[];
}

const TodosQuery: TypedDocumentNode<TodosData> = gql`
  query {
    todos {
      id
      title
      completed
    }
  }
`;

// Fully typed!
const todos = createQuery({ query: TodosQuery });
//    ^? Accessor<OperationResult<TodosData> | undefined>
```

## How It Works

`@urql/solid-start` integrates URQL with SolidStart's primitives:

- **`createQuery`** uses `query()` + `createAsync()` for automatic SSR and caching
- **`createMutation`** uses `action()` + `useAction()` + `useSubmission()` for form integration with fine-grained reactive stores
- **`createSubscription`** re-exported from `@urql/solid` (works identically on client/server)
- **Reactive variables** leverage Solid's fine-grained reactivity via `@solid-primitives/utils`

This means you get:
- ✅ Automatic server-side rendering
- ✅ Request deduplication
- ✅ Streaming responses
- ✅ Progressive enhancement
- ✅ Full fine-grained reactivity

## Resources

- [SolidStart Documentation](https://start.solidjs.com/)
- [URQL Documentation](https://formidable.com/open-source/urql/docs/)
- [Solid Primitives](https://primitives.solidjs.community/)

## License

MIT
