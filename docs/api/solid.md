---
title: '@urql/solid'
order: 4
---

# Solid API

> **Note:** These API docs are deprecated as we now keep TSDocs in all published packages.
> You can view TSDocs while using these packages in your editor, as long as it supports the
> TypeScript Language Server.
> We're planning to replace these API docs with a separate web app soon.

## createQuery

Accepts a single required options object as an input with the following properties:

| Prop            | Type               | Description                                                                                              |
| --------------- | ------------------ | -------------------------------------------------------------------------------------------------------- |
| `query`         | `string \| DocumentNode` | The query to be executed. Accepts as a plain string query or GraphQL DocumentNode.               |
| `variables`     | `?object`          | The variables to be used with the GraphQL request.                                                       |
| `requestPolicy` | `?RequestPolicy`   | An optional [request policy](./core.md#requestpolicy) that should be used specifying the cache strategy. |
| `pause`         | `?boolean`         | A boolean flag instructing [execution to be paused](../basics/solid.md#pausing-createquery).             |
| `context`       | `?object`          | Holds the contextual information for the query.                                                          |

This primitive returns a tuple of the shape `[result, reExecuteQuery]`.

- The `result` is a reactive store object with the shape of an [`OperationResult`](./core.md#operationresult) with
  an added `fetching: boolean` property, indicating whether the query is being fetched. Unlike React hooks, `result`
  is a Solid store that is accessed directly (not as an accessor function).
- The `reExecuteQuery` function optionally accepts
  [`Partial<OperationContext>`](./core.md#operationcontext) and re-executes the current query when
  it's called. When `pause` is set to `true` this executes the query, overriding the otherwise
  paused primitive.

The `variables`, `requestPolicy`, `pause`, and `context` options each accept either a static value
or a Solid accessor function `() => T`. When passed as an accessor, the query will automatically
re-execute whenever the accessor's value changes.

If the `Client` has `suspense` mode enabled, `createQuery` will integrate with Solid's Suspense
boundaries instead of updating the `fetching` flag.

[Read more about how to use the `createQuery` API on the "Queries" page.](../basics/solid.md#queries)

## createMutation

Accepts a single `query` argument of type `string | DocumentNode` and returns a tuple of the shape
`[state, executeMutation]`.

- The `state` is a reactive store object with the shape of an [`OperationResult`](./core.md#operationresult) with
  an added `fetching: boolean` property, indicating whether the mutation is being executed. The
  state updates reactively as the mutation progresses.
- The `executeMutation` function accepts variables and optionally
  [`Partial<OperationContext>`](./core.md#operationcontext) and starts executing the mutation when
  called. It returns a `Promise` resolving to an [`OperationResult`](./core.md#operationresult).

Unlike `createQuery`, `createMutation` does not execute automatically. The returned execute function
must be called with the mutation variables to start the mutation.

The returned promise will never reject — check `result.error` for a
[`CombinedError`](./core.md#combinederror) instead.

[Read more about how to use the `createMutation` API on the "Mutations"
page.](../basics/solid.md#mutations)

## createSubscription

Accepts a single required options object as its first argument with the following properties:

| Prop        | Type                     | Description                                                                                              |
| ----------- | ------------------------ | -------------------------------------------------------------------------------------------------------- |
| `query`     | `string \| DocumentNode` | The subscription query to be executed. Accepts as a plain string query or GraphQL DocumentNode.          |
| `variables` | `?object`                | The variables to be used with the GraphQL request.                                                       |
| `pause`     | `?boolean`               | A boolean flag instructing [execution to be paused](../basics/solid.md#pausing-createquery).             |
| `context`   | `?object`                | Holds the contextual information for the subscription.                                                   |

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
  paused primitive.

The `fetching: boolean` property on the `result` will be set to `false` when the server proactively
ends the subscription. By default, `urql` is unable to start subscriptions since this requires
some additional setup.

[Read more about how to use the `createSubscription` API on the "Subscriptions"
page.](../advanced/subscriptions.md)

## Context API

In `@urql/solid`, the [`Client`](./core.md#client) is passed to all primitives via Solid's Context
API. The `Client` must be provided using the exported `Provider` component.

```jsx
import { createClient, Provider, cacheExchange, fetchExchange } from '@urql/solid';

const client = createClient({
  url: 'http://localhost:3000/graphql',
  exchanges: [cacheExchange, fetchExchange],
});

const App = () => (
  <Provider value={client}>
    <YourRoutes />
  </Provider>
);
```

### useClient

`@urql/solid` also exports a `useClient` function, which retrieves the current [`Client`](./core.md#client)
from Solid's Context. An error is thrown in development if no `Provider` wraps the component.

```js
import { useClient } from '@urql/solid';

const MyComponent = () => {
  const client = useClient();
  // ...
};
```
