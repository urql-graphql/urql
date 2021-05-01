---
title: urql (React)
order: 1
---

# React API

## useQuery

Accepts a single required options object as an input with the following properties:

| Prop            | Type                     | Description                                                                                              |
| --------------- | ------------------------ | -------------------------------------------------------------------------------------------------------- |
| `query`         | `string \| DocumentNode` | The query to be executed. Accepts as a plain string query or GraphQL DocumentNode.                       |
| `variables`     | `?object`                | The variables to be used with the GraphQL request.                                                       |
| `requestPolicy` | `?RequestPolicy`         | An optional [request policy](./core.md#requestpolicy) that should be used specifying the cache strategy. |
| `pause`         | `?boolean`               | A boolean flag instructing [execution to be paused](../basics/react-preact.md#pausing-usequery).              |
| `context`       | `?object`                | Holds the contextual information for the query.                                                          |

This hook returns a tuple of the shape `[result, executeQuery]`.

- The `result` is an object with the shape of an [`OperationResult`](./core.md#operationresult) with
  an added `fetching: boolean` property, indicating whether the query is being fetched.
- The `executeQuery` function optionally accepts
  [`Partial<OperationContext>`](./core.md#operationcontext) and reexecutes the current query when
  it's called. When `pause` is set to `true` this executes the query, overriding the otherwise
  paused hook.

[Read more about how to use the `useQuery` API on the "Queries" page.](../basics/react-preact.md#queries)

## useMutation

Accepts a single `query` argument of type `string | DocumentNode` and returns a tuple of the shape
`[result, executeMutation]`.

- The `result` is an object with the shape of an [`OperationResult`](./core.md#operationresult) with
  an added `fetching: boolean` property, indicating whether the mutation is being executed.
- The `executeMutation` function accepts variables and optionally
  [`Partial<OperationContext>`](./core.md#operationcontext) and may be used to start executing a
  mutation. It returns a `Promise` resolving to an [`OperationResult`](./core.md#operationresult).

[Read more about how to use the `useMutation` API on the "Mutations"
page.](../basics/react-preact.md#mutations)

## useSubscription

Accepts a single required options object as an input with the following properties:

| Prop                                                 | Type                     | Description                                                                        |
| ---------------------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------- |
| `query`                                              | `string \| DocumentNode` | The query to be executed. Accepts as a plain string query or GraphQL DocumentNode. |
| `variables`                                          | `?object`                | The variables to be used with the GraphQL request.                                 |
| `pause`                                              | `?boolean`               | A boolean flag instructing [execution to be paused](../basics/react-preact.md#pausing-usequery). |
| `context`                                            | `?object`                | Holds the contextual information for the query.                                    |

The hook optionally accepts a second argument, which may be a handler function with a type signature
of:

```js
type SubscriptionHandler<T, R> = (previousData: R | undefined, data: T) => R;
```

This function will be called with the previous data (or `undefined`) and the new data that's
incoming from a subscription event, and may be used to "reduce" the data over time, altering the
value of `result.data`.

This hook returns a tuple of the shape `[result, executeQuery]`.

- The `result` is an object with the shape of an [`OperationResult`](./core.md#operationresult).
- The `executeSubscription` function optionally accepts
  [`Partial<OperationContext>`](./core.md#operationcontext) and restarts the current subscription when
  it's called. When `pause` is set to `true` this starts the subscription, overriding the otherwise
  paused hook.

The `fetching: boolean` property on the `result` may change to `false` when the server proactively
ends the subscription. By default, `urql` is unable able to start subscriptions, since this requires
some additional setup.

[Read more about how to use the `useSubscription` API on the "Subscriptions"
page.](../advanced/subscriptions.md)

## Query Component

This component is a wrapper around [`useQuery`](#usequery), exposing a [render prop
API](https://reactjs.org/docs/render-props.html) for cases where hooks aren't desirable.

The API of the `Query` component mirrors the API of [`useQuery`](#usequery). The props that `<Query>`
accepts are the same as `useQuery`'s options object.

A function callback must be passed to `children` that receives the query result and must return a
React element. The second argument of the hook's tuple, `executeQuery` is passed as an added property
on the query result.

## Mutation Component

This component is a wrapper around [`useMutation`](#usemutation), exposing a [render prop
API](https://reactjs.org/docs/render-props.html) for cases where hooks aren't desirable.

The `Mutation` component accepts a `query` prop, and a function callback must be passed to `children`
that receives the mutation result and must return a React element. The second argument of
`useMutation`'s returned tuple, `executeMutation` is passed as an added property on the mutation
result object.

## Subscription Component

This component is a wrapper around [`useSubscription`](#usesubscription), exposing a [render prop
API](https://reactjs.org/docs/render-props.html) for cases where hooks aren't desirable.

The API of the `Subscription` component mirrors the API of [`useSubscription`](#usesubscription).
The props that `<Mutation>` accepts are the same as `useSubscription`'s options object, with an
added, optional `handler` prop that may be passed, which for the `useSubscription` hook is instead
the second argument.

A function callback must be passed to `children` that receives the subscription result and must
return a React element. The second argument of the hook's tuple, `executeSubscription` is passed as
an added property on the subscription result.

## Context

`urql` is used in React by adding a provider around where the [`Client`](./core.md#client) is
supposed to be used. Internally this means that `urql` creates a
[React Context](https://reactjs.org/docs/context.html).

All created parts of this context are exported by `urql`, namely:

- `Context`
- `Provider`
- `Consumer`

To keep examples brief, `urql` creates a default client with the `url` set to `'/graphql'`. This
client will be used when no `Provider` wraps any of `urql`'s hooks. However, to prevent this default
client from being used accidentally, a warning is output in the console for the default client.

### useClient

`urql` also exports a `useClient` hook, which is a convenience wrapper like the following:

```js
import React from 'react';
import { Context } from 'urql';

const useClient = () => React.useContext(Context);
```

However, this hook is also responsible for outputting the default client warning that's mentioned
above, and should thus be preferred over manually using `useContext` with `urql`'s `Context`.
