---
title: '@urql/solid-start'
order: 5
---

# SolidStart API

> **Note:** These API docs are deprecated as we now keep TSDocs in all published packages.
> You can view TSDocs while using these packages in your editor, as long as it supports the
> TypeScript Language Server.
> We're planning to replace these API docs with a separate web app soon.

The `@urql/solid-start` package integrates urql with SolidStart's native data-fetching primitives
(`query()`, `action()`, `createAsync()`, `useAction()`). Its API differs from `@urql/solid` because
queries run on both server and client and mutations are exposed as SolidStart actions.

> For client-side only SolidJS applications, see the [`@urql/solid` API docs](./solid.md) instead.

## createQuery

Creates a cached query function using SolidStart's `query()` primitive.

| Argument    | Type                     | Description                                                                                              |
| ----------- | ------------------------ | -------------------------------------------------------------------------------------------------------- |
| `query`     | `string \| DocumentNode` | The query to be executed. Accepts as a plain string query or GraphQL DocumentNode.                       |
| `key`       | `string`                 | A unique cache key for SolidStart's router to use for deduplication and caching.                         |
| `options`   | `?object`                | Optional configuration object (see table below).                                                         |

The `options` object accepts:

| Prop            | Type                     | Description                                                                                              |
| --------------- | ------------------------ | -------------------------------------------------------------------------------------------------------- |
| `variables`     | `?object`                | Static variables to be used with the GraphQL request.                                                    |
| `requestPolicy` | `?RequestPolicy`         | An optional [request policy](./core.md#requestpolicy) that should be used specifying the cache strategy. |
| `context`       | `?object`                | Holds the contextual information for the query.                                                          |

This function returns a query function (the result of SolidStart's `query()`) that, when called,
executes the GraphQL query and returns a `Promise` resolving to an
[`OperationResult`](./core.md#operationresult). The returned function is intended to be used with
SolidStart's `createAsync()` to get a reactive result in your component:

```jsx
import { createQuery } from '@urql/solid-start';
import { createAsync } from '@solidjs/router';
import { gql } from '@urql/core';

const TodosQuery = gql`
  query { todos { id title } }
`;

const queryTodos = createQuery(TodosQuery, 'todos-list');

export default function Todos() {
  const result = createAsync(() => queryTodos());
  // ...
}
```

`createQuery` must be called inside a component (or a reactive context) where it has access to the
URQL context, as it reads the `Client` and SolidStart `query` function from the `Provider`.

[Read more about how to use the `createQuery` API on the "Queries" page.](../basics/solid-start.md#queries)

## createMutation

Creates a GraphQL mutation action using SolidStart's `action()` primitive.

| Argument    | Type                     | Description                                                                        |
| ----------- | ------------------------ | ---------------------------------------------------------------------------------- |
| `mutation`  | `string \| DocumentNode` | The mutation to be executed. Accepts as a plain string query or GraphQL DocumentNode. |
| `key`       | `string`                 | A unique cache key for SolidStart's router.                                        |

Returns a `CreateMutationAction`, which is a SolidStart `Action` that accepts mutation variables
and an optional [`Partial<OperationContext>`](./core.md#operationcontext), and resolves to an
[`OperationResult`](./core.md#operationresult).

The returned action integrates with SolidStart's `useAction()` and `useSubmission()` primitives for
reactive state tracking and progressive enhancement:

```jsx
import { createMutation } from '@urql/solid-start';
import { useAction, useSubmission } from '@solidjs/router';
import { gql } from '@urql/core';

const UpdateTodo = gql`
  mutation ($id: ID!, $title: String!) {
    updateTodo(id: $id, title: $title) { id title }
  }
`;

function EditTodo() {
  const updateTodoAction = createMutation(UpdateTodo, 'update-todo');
  const updateTodo = useAction(updateTodoAction);
  const submission = useSubmission(updateTodoAction);
  // ...
}
```

`createMutation` must be called inside a component where it has access to the URQL context.

[Read more about how to use the `createMutation` API on the "Mutations" page.](../basics/solid-start.md#mutations)

## createSubscription

Accepts a single required options object as its first argument with the following properties:

| Prop        | Type                     | Description                                                                      |
| ----------- | ------------------------ | -------------------------------------------------------------------------------- |
| `query`     | `string \| DocumentNode` | The subscription query to be executed. Accepts as a plain string query or GraphQL DocumentNode. |
| `variables` | `?object`                | The variables to be used with the GraphQL request.                               |
| `pause`     | `?boolean`               | A boolean flag instructing execution to be paused.                               |
| `context`   | `?object`                | Holds the contextual information for the subscription.                           |

The primitive optionally accepts a second argument, a handler function with a type signature of:

```js
type SubscriptionHandler<T, R> = (previousData: R | undefined, data: T) => R;
```

This function will be called with the previous data (or `undefined`) and the new data that's
incoming from a subscription event, and may be used to "reduce" the data over time, altering the
value of `result.data`.

This primitive returns a tuple of the shape `[result, executeSubscription]`.

- The `result` is a reactive store object with the shape of an [`OperationResult`](./core.md#operationresult).
- The `executeSubscription` function optionally accepts
  [`Partial<OperationContext>`](./core.md#operationcontext) and restarts the current subscription when
  it's called. When `pause` is set to `true` this starts the subscription, overriding the otherwise
  paused state.

Note that GraphQL subscriptions require a subscription exchange (e.g. `subscriptionExchange`) to be
configured on the `Client`.

[Read more about how to use the `createSubscription` API on the "Subscriptions"
page.](../advanced/subscriptions.md)

## Context API

In `@urql/solid-start`, the context holds the `Client` as well as SolidStart's `query` and `action`
functions. All three must be provided together via the `Provider` component:

```jsx
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

The `Provider` value is an object with the following shape:

| Prop     | Type                    | Description                                                  |
| -------- | ----------------------- | ------------------------------------------------------------ |
| `client` | `Client`                | The [`Client`](./core.md#client) instance to use.            |
| `query`  | `query` (from router)   | SolidStart's `query` function from `@solidjs/router`.        |
| `action` | `action` (from router)  | SolidStart's `action` function from `@solidjs/router`.       |

### useClient

Returns the [`Client`](./core.md#client) from the current URQL context. Throws an error in
development if no `Provider` wraps the component.

### useQuery

Returns SolidStart's `query` function from the current URQL context. Used internally by
[`createQuery`](#createquery).

### useAction

Returns SolidStart's `action` function from the current URQL context. Used internally by
[`createMutation`](#createmutation).
