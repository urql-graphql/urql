---
title: '@urql/svelte'
order: 3
---

# Svelte API

> **Note:** These API docs are deprecated as we now keep TSDocs in all published packages.
> You can view TSDocs while using these packages in your editor, as long as it supports the
> TypeScript Language Server.
> We're planning to replace these API docs with a separate web app soon.

## queryStore

The `queryStore` factory accepts properties as inputs and returns a Svelte pausable, readable store
of results, with type `OperationResultStore & Pausable`.

| Argument        | Type                       | Description                                                                                              |
| --------------- | -------------------------- | -------------------------------------------------------------------------------------------------------- |
| `client`        | `Client`                   | The [`Client`](./core.md#Client) to use for the operation.                                               |
| `query`         | `string \| DocumentNode \` | The query to be executed. Accepts as a plain string query or GraphQL DocumentNode.                       |
| `variables`     | `?object`                  | The variables to be used with the GraphQL request.                                                       |
| `requestPolicy` | `?RequestPolicy`           | An optional [request policy](./core.md#requestpolicy) that should be used specifying the cache strategy. |
| `pause`         | `?boolean`                 | A boolean flag instructing [execution to be paused](../basics/vue.md#pausing-usequery).                  |
| `context`       | `?object`                  | Holds the contextual information for the query.                                                          |

This store is pausable, which means that the result has methods on it to `pause()` or `resume()`
the subscription of the operation.

[Read more about how to use the `queryStore` API on the "Queries" page.](../basics/svelte.md#queries)

## mutationStore

The `mutationStore` factory accepts properties as inputs and returns a Svelte readable store of a result.

| Argument    | Type                       | Description                                                                        |
| ----------- | -------------------------- | ---------------------------------------------------------------------------------- |
| `client`    | `Client`                   | The [`Client`](./core.md#Client) to use for the operation.                         |
| `query`     | `string \| DocumentNode \` | The query to be executed. Accepts as a plain string query or GraphQL DocumentNode. |
| `variables` | `?object`                  | The variables to be used with the GraphQL request.                                 |
| `context`   | `?object`                  | Holds the contextual information for the query.                                    |

[Read more about how to use the `mutation` API on the "Mutations"
page.](../basics/svelte.md#mutations)

## subscriptionStore

The `subscriptionStore` utility function accepts the same inputs as `queryStore` does as its first
argument, [see above](#querystore).

The function also optionally accepts a second argument, a `handler` function. This function has the
following type signature:

```js
type SubscriptionHandler<T, R> = (previousData: R | undefined, data: T) => R;
```

This function will be called with the previous data (or `undefined`) and the new data that's
incoming from a subscription event, and may be used to "reduce" the data over time, altering the
value of `result.data`.

[Read more about how to use the `subscription` API on the "Subscriptions"
page.](../advanced/subscriptions.md#svelte)

## OperationResultStore

A Svelte Readble store of an [`OperationResult`](./core.md#operationresult).
This store will be updated as the incoming data changes.

| Prop         | Type                   | Description                                                                                                                                        |
| ------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data`       | `?any`                 | Data returned by the specified query                                                                                                               |
| `error`      | `?CombinedError`       | A [`CombinedError`](./core.md#combinederror) instances that wraps network or `GraphQLError`s (if any)                                              |
| `extensions` | `?Record<string, any>` | Extensions that the GraphQL server may have returned.                                                                                              |
| `stale`      | `boolean`              | A flag that may be set to `true` by exchanges to indicate that the `data` is incomplete or out-of-date, and that the result will be updated soon.  |
| `fetching`   | `boolean`              | A flag that indicates whether the operation is currently in progress, which means that the `data` and `error` is out-of-date for the given inputs. |

## Pausable

The `queryStore` and `subscriptionStore`'s stores are pausable. This means they inherit the
following properties from the `Pausable` store.

| Prop        | Type                | Description                                                                                                                  |
| ----------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `isPaused$` | `Readable<boolean>` | A Svelte readable store indicating whether the operation is currently paused. Essentially, this is equivalent to `!fetching` |
| `pause()`   | `pause(): void`     | This method pauses the ongoing operation.                                                                                    |
| `resume()`  | `resume(): void`    | This method resumes the previously paused operation.                                                                         |

## Context API

In `urql`'s Svelte bindings, the [`Client`](./core.md#client) is passed into the factories for
stores above manually. This is to cater to greater flexibility. However, for convenience's sake,
instead of keeping a `Client` singleton, we may also use [Svelte's Context
API](https://svelte.dev/tutorial/context-api).

`@urql/svelte` provides wrapper functions around Svelte's [`setContext`](https://svelte.dev/docs#run-time-svelte-setcontext) and
[`getContext`](https://svelte.dev/docs#run-time-svelte-getcontext) functions:

- `setContextClient`
- `getContextClient`
- `initContextClient` (a shortcut for `createClient` + `setContextClient`)
