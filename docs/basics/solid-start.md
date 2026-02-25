---
title: SolidStart Bindings
order: 3
---

# SolidStart

This guide covers how to use `@urql/solid-start` with SolidStart applications. The `@urql/solid-start` package integrates urql with SolidStart's native data fetching primitives like `query()`, `action()`, `createAsync()`, and `useAction()`.

> **Note:** This guide is for SolidStart applications with SSR. If you're building a client-side only SolidJS app, see the [Solid guide](./solid.md) instead. See the [comparison section](#solidjs-vs-solidstart) below for key differences between the packages.

## Getting started

### Installation

Installing `@urql/solid-start` requires both the package and its peer dependencies:

```sh
yarn add @urql/solid-start @urql/solid @urql/core graphql
# or
npm install --save @urql/solid-start @urql/solid @urql/core graphql
# or
pnpm add @urql/solid-start @urql/solid @urql/core graphql
```

The `@urql/solid-start` package depends on `@urql/solid` for shared utilities and re-exports some primitives that work identically on both client and server.

### Setting up the `Client`

The `@urql/solid-start` package exports a `Client` class from `@urql/core`. This central `Client` manages all of our GraphQL requests and results.

```js
import { createClient, cacheExchange, fetchExchange } from '@urql/solid-start';

const client = createClient({
  url: 'http://localhost:3000/graphql',
  exchanges: [cacheExchange, fetchExchange],
});
```

At the bare minimum we'll need to pass an API's `url` and `exchanges` when we create a `Client`.

For server-side requests, you'll often want to customize `fetchOptions` to include headers like cookies or authorization tokens:

```js
import { getRequestEvent } from 'solid-js/web';

const client = createClient({
  url: 'http://localhost:3000/graphql',
  exchanges: [cacheExchange, fetchExchange],
  fetchOptions: () => {
    const event = getRequestEvent();
    return {
      headers: {
        cookie: event?.request.headers.get('cookie') || '',
      },
    };
  },
});
```

### Providing the `Client`

To make use of the `Client` in SolidStart we will provide it via Solid's Context API using the `Provider` export. The Provider also needs the `query` and `action` functions from `@solidjs/router`:

```jsx
// src/root.tsx or src/app.tsx
import { Router, action, query } from '@solidjs/router';
import { FileRoutes } from '@solidjs/start/router';
import { Suspense } from 'solid-js';
import { createClient, Provider, cacheExchange, fetchExchange } from '@urql/solid-start';

const client = createClient({
  url: 'http://localhost:3000/graphql',
  exchanges: [cacheExchange, fetchExchange],
});

export default function App() {
  return (
    <Router
      root={props => (
        <Provider value={{ client, query, action }}>
          <Suspense>{props.children}</Suspense>
        </Provider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
```

Now every route and component inside the `Provider` can use GraphQL queries and mutations that will be sent to our API. The `query` and `action` functions are provided in context so that `createQuery` and `createMutation` can access them automatically.

## Queries

The `@urql/solid-start` package offers a `createQuery` primitive that integrates with SolidStart's `query()` and `createAsync()` primitives for optimal server-side rendering and streaming.

### Run a first query

For the following examples, we'll imagine that we're querying data from a GraphQL API that contains todo items.

```jsx
// src/routes/todos.tsx
import { Suspense, For, Show } from 'solid-js';
import { createAsync } from '@solidjs/router';
import { gql } from '@urql/core';
import { createQuery } from '@urql/solid-start';

const TodosQuery = gql`
  query {
    todos {
      id
      title
    }
  }
`;

export default function Todos() {
  const queryTodos = createQuery(TodosQuery, 'todos-list');
  const result = createAsync(() => queryTodos());

  return (
    <Suspense fallback={<p>Loading...</p>}>
      <Show when={result()?.data}>
        <ul>
          <For each={result()!.data.todos}>
            {(todo) => <li>{todo.title}</li>}
          </For>
        </ul>
      </Show>
    </Suspense>
  );
}
```

The `createQuery` primitive integrates with SolidStart's data fetching system:

1. It wraps SolidStart's `query()` function to execute URQL queries with proper router context
2. The `query` function is automatically retrieved from the URQL context (no manual injection needed)
3. The second parameter is a cache key (string) for SolidStart's router
4. The returned function is wrapped with `createAsync()` to get the reactive result
5. `createQuery` must be called inside a component where it has access to the context

The query automatically executes on both the server (during SSR) and the client, with SolidStart handling serialization and hydration.

### Variables

Typically we'll also need to pass variables to our queries. Pass variables as an option in the fourth parameter:

```jsx
// src/routes/todos/[page].tsx
import { Suspense, For, Show } from 'solid-js';
import { useParams, createAsync } from '@solidjs/router';
import { gql } from '@urql/core';
import { createQuery } from '@urql/solid-start';

const TodosListQuery = gql`
  query ($from: Int!, $limit: Int!) {
    todos(from: $from, limit: $limit) {
      id
      title
    }
  }
`;

export default function TodosPage() {
  const params = useParams();

  const queryTodos = createQuery(TodosListQuery, 'todos-paginated', {
    variables: {
      from: parseInt(params.page) * 10,
      limit: 10,
    },
  });

  const result = createAsync(() => queryTodos());

  return (
    <Suspense fallback={<p>Loading...</p>}>
      <Show when={result()?.data}>
        <ul>
          <For each={result()!.data.todos}>
            {(todo) => <li>{todo.title}</li>}
          </For>
        </ul>
      </Show>
    </Suspense>
  );
}
```

For dynamic variables that change based on reactive values, you'll need to recreate the query function when dependencies change.

### Request Policies

The `requestPolicy` option determines how results are retrieved from the cache:

```jsx
const queryTodos = createQuery(TodosQuery, 'todos-list', {
  requestPolicy: 'cache-and-network',
});
const result = createAsync(() => queryTodos());
```

Available policies:

- `cache-first` (default): Prefer cached results, fall back to network
- `cache-only`: Only use cached results, never send network requests
- `network-only`: Always send a network request, ignore cache
- `cache-and-network`: Return cached results immediately, then fetch from network

[Learn more about request policies on the "Document Caching" page.](./document-caching.md)

### Revalidation

There are two approaches to revalidating data in SolidStart with urql:

1. **urql's cache invalidation** - Invalidates specific queries or entities in urql's cache, causing automatic refetches
2. **SolidStart's revalidation** - Uses SolidStart's router revalidation to reload route data

Both approaches work well, and you can choose based on your needs. urql's invalidation is more granular and works at the query level, while SolidStart's revalidation works at the route level.

#### Manual Revalidation with urql

You can manually revalidate queries using urql's cache invalidation with the `keyFor` helper. This invalidates specific queries in urql's cache and triggers automatic refetches:

```jsx
// src/routes/todos.tsx
import { Suspense, For, Show } from 'solid-js';
import { createAsync } from '@solidjs/router';
import { gql, keyFor } from '@urql/core';
import { createQuery, useClient } from '@urql/solid-start';

const TodosQuery = gql`
  query {
    todos {
      id
      title
    }
  }
`;

export default function Todos() {
  const client = useClient();
  const queryTodos = createQuery(TodosQuery, 'todos-list');
  const result = createAsync(() => queryTodos());

  const handleRefresh = () => {
    // Invalidate the todos query using keyFor
    const key = keyFor(TodosQuery);
    client.reexecuteOperation(client.createRequestOperation('query', {
      key,
      query: TodosQuery
    }));
  };

  return (
    <div>
      <button onClick={handleRefresh}>Refresh Todos</button>
      <Suspense fallback={<p>Loading...</p>}>
        <Show when={result()?.data}>
          <ul>
            <For each={result()!.data.todos}>
              {(todo) => <li>{todo.title}</li>}
            </For>
          </ul>
        </Show>
      </Suspense>
    </div>
  );
}
```

#### Manual Revalidation with SolidStart

Alternatively, you can use SolidStart's built-in `revalidate` function to reload route data. This is useful when you want to refresh all queries on a specific route:

```jsx
// src/routes/todos.tsx
import { Suspense, For, Show } from 'solid-js';
import { createAsync, revalidate } from '@solidjs/router';
import { gql } from '@urql/core';
import { createQuery } from '@urql/solid-start';

const TodosQuery = gql`
  query {
    todos {
      id
      title
    }
  }
`;

export default function Todos() {
  const queryTodos = createQuery(TodosQuery, 'todos-list');
  const result = createAsync(() => queryTodos());

  const handleRefresh = async () => {
    // Revalidate the current route - refetches all queries on this page
    await revalidate();
  };

  return (
    <div>
      <button onClick={handleRefresh}>Refresh Todos</button>
      <Suspense fallback={<p>Loading...</p>}>
        <Show when={result()?.data}>
          <ul>
            <For each={result()!.data.todos}>
              {(todo) => <li>{todo.title}</li>}
            </For>
          </ul>
        </Show>
      </Suspense>
    </div>
  );
}
```

#### Revalidation After Mutations

A common pattern is to revalidate after a mutation succeeds. You can choose either approach:

**Using urql's cache invalidation:**

```jsx
// src/routes/todos/new.tsx
import { useNavigate } from '@solidjs/router';
import { gql, keyFor } from '@urql/core';
import { createMutation, useClient } from '@urql/solid-start';

const TodosQuery = gql`
  query {
    todos {
      id
      title
    }
  }
`;

const CreateTodo = gql`
  mutation ($title: String!) {
    createTodo(title: $title) {
      id
      title
    }
  }
`;

export default function NewTodo() {
  const navigate = useNavigate();
  const client = useClient();
  const [state, createTodo] = createMutation(CreateTodo);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const title = formData.get('title') as string;

    const result = await createTodo({ title });

    if (!result.error) {
      // Invalidate todos query using keyFor
      const key = keyFor(TodosQuery);
      client.reexecuteOperation(client.createRequestOperation('query', {
        key,
        query: TodosQuery
      }));
      navigate('/todos');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="title" type="text" required />
      <button type="submit" disabled={state.fetching}>
        {state.fetching ? 'Creating...' : 'Create Todo'}
      </button>
    </form>
  );
}
```

**Using SolidStart's revalidation:**

```jsx
// src/routes/todos/new.tsx
import { useNavigate } from '@solidjs/router';
import { gql } from '@urql/core';
import { createMutation } from '@urql/solid-start';
import { revalidate } from '@solidjs/router';

const CreateTodo = gql`
  mutation ($title: String!) {
    createTodo(title: $title) {
      id
      title
    }
  }
`;

export default function NewTodo() {
  const navigate = useNavigate();
  const [state, createTodo] = createMutation(CreateTodo);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const title = formData.get('title') as string;

    const result = await createTodo({ title });

    if (!result.error) {
      // Revalidate the /todos route to refetch all its queries
      await revalidate('/todos');
      navigate('/todos');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="title" type="text" required />
      <button type="submit" disabled={state.fetching}>
        {state.fetching ? 'Creating...' : 'Create Todo'}
      </button>
    </form>
  );
}
```

#### Automatic Revalidation with Actions

When using SolidStart actions, you can configure automatic revalidation by returning the appropriate response:

```jsx
import { action, revalidate } from '@solidjs/router';
import { gql } from '@urql/core';

const createTodoAction = action(async (formData: FormData) => {
  const title = formData.get('title') as string;

  // Perform mutation
  const result = await client.mutation(CreateTodo, { title }).toPromise();

  if (!result.error) {
    // Revalidate multiple routes if needed
    await revalidate(['/todos', '/']);
  }

  return result;
});
```

#### Choosing Between Approaches

**Use urql's `keyFor` and `reexecuteOperation` when:**

- You need to refetch a specific query after a mutation
- You want fine-grained control over which queries to refresh
- You're working with multiple queries on the same route and only want to refetch one

**Use SolidStart's `revalidate` when:**

- You want to refresh all data on a route
- You're navigating to a different route and want to ensure fresh data
- You want to leverage SolidStart's routing system for cache management

Both approaches are valid and can even be used together depending on your application's needs.

### Context Options

Context options can be passed to customize the query behavior:

```jsx
const queryTodos = createQuery(TodosQuery, 'todos-list', {
  context: {
    requestPolicy: 'cache-and-network',
    fetchOptions: {
      headers: {
        'X-Custom-Header': 'value',
      },
    },
  },
});
const result = createAsync(() => queryTodos());
```

[You can find a list of all `Context` options in the API docs.](../api/core.md#operationcontext)

## Mutations

The `@urql/solid-start` package offers a `createMutation` primitive that integrates with SolidStart's `action()` and `useAction()` primitives.

### Sending a mutation

Mutations in SolidStart are executed using actions. Here's an example of updating a todo item:

```jsx
// src/routes/todos/[id]/edit.tsx
import { gql } from '@urql/core';
import { createMutation } from '@urql/solid-start';
import { useParams, useNavigate } from '@solidjs/router';
import { Show } from 'solid-js';

const UpdateTodo = gql`
  mutation ($id: ID!, $title: String!) {
    updateTodo(id: $id, title: $title) {
      id
      title
    }
  }
`;

export default function EditTodo() {
  const params = useParams();
  const navigate = useNavigate();
  const [state, updateTodo] = createMutation(UpdateTodo);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const title = formData.get('title') as string;

    const result = await updateTodo({
      id: params.id,
      title,
    });

    if (!result.error) {
      navigate(`/todos/${params.id}`);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="title" type="text" required />
      <button type="submit" disabled={state.fetching}>
        {state.fetching ? 'Saving...' : 'Save'}
      </button>
      <Show when={state.error}>
        <p style={{ color: 'red' }}>Error: {state.error.message}</p>
      </Show>
    </form>
  );
}
```

The `createMutation` primitive returns a tuple:

1. A reactive state object containing `fetching`, `error`, and `data`
2. An execute function that triggers the mutation

You can optionally provide a custom `key` parameter to control how mutations are cached by SolidStart's router:

```jsx
const [state, updateTodo] = createMutation(UpdateTodo, 'update-todo-mutation');
```

### Progressive enhancement with actions

SolidStart actions work with and without JavaScript enabled. Here's how to set up a mutation that works progressively:

```jsx
import { action, redirect } from '@solidjs/router';
import { gql } from '@urql/core';
import { createMutation } from '@urql/solid-start';

const CreateTodo = gql`
  mutation ($title: String!) {
    createTodo(title: $title) {
      id
      title
    }
  }
`;

export default function NewTodo() {
  const [state, createTodo] = createMutation(CreateTodo);

  const handleSubmit = async (formData: FormData) => {
    const title = formData.get('title') as string;
    const result = await createTodo({ title });

    if (!result.error) {
      return redirect('/todos');
    }
  };

  return (
    <form action={handleSubmit} method="post">
      <input name="title" type="text" required />
      <button type="submit" disabled={state.fetching}>
        {state.fetching ? 'Creating...' : 'Create Todo'}
      </button>
      <Show when={state.error}>
        <p style={{ color: 'red' }}>Error: {state.error.message}</p>
      </Show>
    </form>
  );
}
```

### Using mutation results

The mutation state is reactive and updates automatically as the mutation progresses:

```jsx
const [state, updateTodo] = createMutation(UpdateTodo);

createEffect(() => {
  if (state.data) {
    console.log('Mutation succeeded:', state.data);
  }
  if (state.error) {
    console.error('Mutation failed:', state.error);
  }
  if (state.fetching) {
    console.log('Mutation in progress...');
  }
});
```

The execute function also returns a promise that resolves to the result:

```jsx
const [state, updateTodo] = createMutation(UpdateTodo);

const handleUpdate = async () => {
  const result = await updateTodo({ id: '1', title: 'Updated' });

  if (result.error) {
    console.error('Oh no!', result.error);
  } else {
    console.log('Success!', result.data);
  }
};
```

### Handling mutation errors

Mutation promises never reject. Instead, check the `error` field on the result:

```jsx
const [state, updateTodo] = createMutation(UpdateTodo);

const handleUpdate = async () => {
  const result = await updateTodo({ id: '1', title: 'Updated' });

  if (result.error) {
    // CombinedError with network or GraphQL errors
    console.error('Mutation failed:', result.error);

    // Check for specific error types
    if (result.error.networkError) {
      console.error('Network error:', result.error.networkError);
    }
    if (result.error.graphQLErrors.length > 0) {
      console.error('GraphQL errors:', result.error.graphQLErrors);
    }
  }
};
```

[Read more about error handling on the "Errors" page.](./errors.md)

## Subscriptions

For GraphQL subscriptions, `@urql/solid-start` provides a `createSubscription` primitive that uses the same SolidStart `Provider` context as `createQuery` and `createMutation`:

```jsx
import { gql } from '@urql/core';
import { createSubscription } from '@urql/solid-start';
import { createSignal, For } from 'solid-js';

const NewTodos = gql`
  subscription {
    newTodos {
      id
      title
    }
  }
`;

export default function TodoSubscription() {
  const [todos, setTodos] = createSignal([]);

  const handleSubscription = (previousData, newData) => {
    setTodos(current => [...current, newData.newTodos]);
    return newData;
  };

  const [result] = createSubscription(
    {
      query: NewTodos,
    },
    handleSubscription
  );

  return (
    <div>
      <h2>Live Updates</h2>
      <ul>
        <For each={todos()}>{todo => <li>{todo.title}</li>}</For>
      </ul>
    </div>
  );
}
```

Note that GraphQL subscriptions typically require WebSocket support. You'll need to configure your client with a subscription exchange like `subscriptionExchange` from `@urql/core`.

## Server-Side Rendering

SolidStart automatically handles server-side rendering and hydration. The `createQuery` primitive works seamlessly on both server and client:

1. On the server, queries execute during SSR and their results are serialized
2. On the client, SolidStart hydrates the data without refetching
3. Subsequent navigations use the standard cache policies

### SSR Considerations

When using `createQuery` in SolidStart:

- Queries execute on the server during initial page load
- Results are automatically streamed to the client
- The client hydrates with the server data
- No manual script injection or data serialization needed
- SolidStart handles all the complexity automatically

### Handling cookies and authentication

For authenticated requests, forward cookies and headers from the server request:

```jsx
import { getRequestEvent } from 'solid-js/web';
import { createClient, cacheExchange, fetchExchange } from '@urql/solid-start';

const client = createClient({
  url: 'http://localhost:3000/graphql',
  exchanges: [cacheExchange, fetchExchange],
  fetchOptions: () => {
    const event = getRequestEvent();
    const headers: Record<string, string> = {};

    // Forward cookies for authenticated requests
    if (event) {
      const cookie = event.request.headers.get('cookie');
      if (cookie) {
        headers.cookie = cookie;
      }
    }

    return { headers };
  },
});
```

## SolidJS vs SolidStart

### When to Use Each Package

| Use Case           | Package             | Why                                                              |
| ------------------ | ------------------- | ---------------------------------------------------------------- |
| Client-side SPA    | `@urql/solid`       | Optimized for client-only apps, uses SolidJS reactivity patterns |
| SolidStart SSR App | `@urql/solid-start` | Integrates with SolidStart's routing, SSR, and action system     |

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

For more details, see the [Solid bindings documentation](./solid.md).

## Reading on

This concludes the introduction for using `@urql/solid-start` with SolidStart. For more information:

- [Solid bindings documentation](./solid.md) - for client-only features
- [How does the default "document cache" work?](./document-caching.md)
- [How are errors handled and represented?](./errors.md)
- [A quick overview of `urql`'s architecture and structure.](../architecture.md)
- [Setting up other features, like authentication, uploads, or persisted queries.](../advanced/README.md)
