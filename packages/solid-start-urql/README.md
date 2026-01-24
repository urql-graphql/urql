# @urql/solid-start

`@urql/solid-start` provides URQL integration for [SolidStart](https://start.solidjs.com/), built with SolidStart's native primitives like `query`, `action`, and `createAsync`.

> **Note:** This package is specifically designed for SolidStart applications with SSR. If you're building a client-side only SolidJS app, use [`@urql/solid`](https://github.com/urql-graphql/urql/tree/main/packages/solid-urql) instead. See [SolidJS vs SolidStart](#solidjs-vs-solidstart) for key differences.

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

Wrap your app with the `Provider` to make the URQL client and query function available:

```tsx
// src/app.tsx
import { Router, query } from '@solidjs/router';
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
        <Provider value={{ client, query }}>
          {props.children}
        </Provider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
```

> **Note:** The Provider now accepts an object with both `client` and `query`. This allows `createQuery` to automatically access the SolidStart query function without manual injection.

### 2. Use Queries

```tsx
// src/routes/todos.tsx
import { createQuery } from '@urql/solid-start';
import { createAsync } from '@solidjs/router';
import { gql } from '@urql/core';
import { For, Show, Suspense } from 'solid-js';

const TodosQuery = gql`
  query {
    todos {
      id
      title
      completed
    }
  }
`;

export default function TodosPage() {
  const queryTodos = createQuery(TodosQuery, 'todos-list');
  const todos = createAsync(() => queryTodos());

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
import { useAction, useSubmission } from '@solidjs/router';
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
  const addTodoAction = createMutation(AddTodoMutation, 'add-todo');
  const addTodo = useAction(addTodoAction);
  const submission = useSubmission(addTodoAction);
  
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
      <button type="submit" disabled={submission.pending}>
        Add Todo
      </button>
      <Show when={submission.result?.error}>
        <p>Error: {submission.result!.error.message}</p>
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

### `createQuery(queryDocument, key, options?)`

Creates a GraphQL query using SolidStart's `query` and `createAsync` primitives. The `query` function is automatically retrieved from context.

**Parameters:**
- `queryDocument: DocumentInput` - GraphQL query document
- `key: string` - Cache key for SolidStart's router
- `options?: object` - Optional configuration
  - `variables?: Variables` - Query variables
  - `requestPolicy?: RequestPolicy` - Cache policy
  - `context?: Partial<OperationContext>` - Additional context

**Returns:** A query function that can be used with `createAsync`

**Basic Example:**
```tsx
import { createAsync } from '@solidjs/router';
import { createQuery } from '@urql/solid-start';

export default function TodosPage() {
  const queryTodos = createQuery(TodosQuery, 'todos-list');
  const todos = createAsync(() => queryTodos());
  
  return <div>{/* ... */}</div>;
}
```

**Example with variables:**
```tsx
import { createAsync } from '@solidjs/router';
import { createQuery } from '@urql/solid-start';

export default function UserPage() {
  const queryUser = createQuery(UserQuery, 'user-details', {
    variables: { id: 1 },
  });
  const user = createAsync(() => queryUser());
  
  return <div>{/* ... */}</div>;
}
```

**Example with custom client:**
```tsx
import { createAsync } from '@solidjs/router';
import { createQuery } from '@urql/solid-start';
import { createClient } from '@urql/core';

const customClient = createClient({ url: 'https://api.example.com/graphql' });

export default function CustomPage() {
  const queryTodos = createQuery(TodosQuery, 'todos-list');
  const todos = createAsync(() => queryTodos(customClient));
  
  return <div>{/* ... */}</div>;
}
```

> **Note:** `createQuery` must be called inside a component where it has access to the URQL context. The query function from `@solidjs/router` is automatically retrieved from the Provider.

### `createMutation(mutation, key)`

Creates a GraphQL mutation action using SolidStart's `action` primitive.

**Args:**
- `mutation: DocumentInput` - GraphQL mutation document
- `key: string` - Cache key for SolidStart's router

**Returns:** `Action` - A SolidStart action that can be used with `useAction()` and `useSubmission()`

**Example:**
```tsx
import { createMutation } from '@urql/solid-start';
import { useAction, useSubmission } from '@solidjs/router';

const updateUserAction = createMutation(UpdateUserMutation, 'update-user');
const updateUser = useAction(updateUserAction);
const submission = useSubmission(updateUserAction);

// Call the mutation
const result = await updateUser({ id: 1, name: 'Alice' });

// Access submission state
console.log(submission.pending); // boolean
console.log(submission.result); // OperationResult
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

Context provider for the URQL client and SolidStart query function.

**Props:**
- `value: { client: Client; query: typeof query }` - Object containing the URQL client and query function

**Example:**
```tsx
import { query } from '@solidjs/router';
import { Provider } from '@urql/solid-start';

<Provider value={{ client, query }}>
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

## Dynamic Queries

For dynamic queries that change based on reactive values, you can pass variables to the query function:

```tsx
import { createSignal } from 'solid-js';
import { createAsync } from '@solidjs/router';
import { createQuery } from '@urql/solid-start';

export default function UserPage() {
  const [userId, setUserId] = createSignal(1);
  
  // Create the query function
  const queryUser = createQuery(UserQuery, 'user-details', {
    variables: { id: userId() },
  });
  
  // Wrap with createAsync to get reactive data
  const user = createAsync(() => queryUser());
  
  return (
    <div>
      <button onClick={() => setUserId(userId() + 1)}>
        Next User
      </button>
      <Show when={user()?.data}>
        <h1>{user()!.data.user.name}</h1>
      </Show>
    </div>
  );
}
```

Note: For fully reactive variables that trigger re-fetches, you may need to create the query function inside a `createEffect` or recreate it when dependencies change.

## Cache Keys

Cache keys are required for both queries and mutations to enable SolidStart's caching and revalidation features:

```tsx
// Query with cache key
const queryTodos = createQuery(TodosQuery, 'todos-list', query);

// Mutation with cache key
const [state, addTodo] = createMutation(AddTodoMutation, 'add-todo');
```

Choose descriptive cache keys that:
- Are unique within your application
- Describe the data being cached (e.g., 'user-profile', 'todos-list')
- Make debugging easier by being human-readable

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

- **`createQuery`** wraps SolidStart's `query()` function to execute URQL queries with automatic SSR and caching. The `query` function is automatically retrieved from the URQL context, eliminating the need for manual injection.
- **`createMutation`** creates SolidStart `action()` primitives that integrate with `useAction()` and `useSubmission()` for form handling and progressive enhancement
- **`createSubscription`** re-exported from `@urql/solid` (works identically on client/server)

This means you get:
- ✅ Automatic server-side rendering
- ✅ Request deduplication via SolidStart's query caching
- ✅ Streaming responses
- ✅ Progressive enhancement with actions
- ✅ Full fine-grained reactivity

## SolidJS vs SolidStart

### When to Use Each Package

| Use Case | Package | Why |
|----------|---------|-----|
| Client-side SPA | `@urql/solid` | Optimized for client-only apps, uses SolidJS reactivity patterns |
| SolidStart SSR App | `@urql/solid-start` | Integrates with SolidStart's routing, SSR, and action system |

### Key Differences

#### Queries

**@urql/solid** (Client-side):
```tsx
import { createQuery } from '@urql/solid';

const [result] = createQuery({ query: TodosQuery });
// Returns: [Accessor<OperationResult>, Accessor<ReExecute>]
```

**@urql/solid-start** (SSR):
```tsx
import { createQuery } from '@urql/solid-start';
import { createAsync } from '@solidjs/router';

const queryTodos = createQuery(TodosQuery, 'todos');
const todos = createAsync(() => queryTodos());
// Returns: Accessor<OperationResult | undefined>
// Works with SSR and SolidStart's caching
```

#### Mutations

**@urql/solid** (Client-side):
```tsx
import { createMutation } from '@urql/solid';

const [result, executeMutation] = createMutation(AddTodoMutation);
await executeMutation({ title: 'New Todo' });
// Returns: [Accessor<OperationResult>, ExecuteMutation]
```

**@urql/solid-start** (SSR with Actions):
```tsx
import { createMutation } from '@urql/solid-start';
import { useAction, useSubmission } from '@solidjs/router';

const addTodoAction = createMutation(AddTodoMutation, 'add-todo');
const addTodo = useAction(addTodoAction);
const submission = useSubmission(addTodoAction);
await addTodo({ title: 'New Todo' });
// Integrates with SolidStart's action system for progressive enhancement
```

### Why Different APIs?

- **SSR Support**: SolidStart queries run on the server and stream to the client
- **Router Integration**: Automatic caching and invalidation with SolidStart's router
- **Progressive Enhancement**: Actions work without JavaScript enabled
- **Suspense**: Native support for SolidJS Suspense boundaries

### Migration

If you're moving from a SolidJS SPA to SolidStart:
1. Change imports from `@urql/solid` to `@urql/solid-start`
2. Wrap queries with `createAsync()`
3. Update mutations to use the action pattern with `useAction()` and `useSubmission()`

## Resources

- [SolidStart Documentation](https://start.solidjs.com/)
- [URQL Documentation](https://formidable.com/open-source/urql/docs/)
- [Solid Primitives](https://primitives.solidjs.community/)

## License

MIT
