---
title: '@urql/svelte'
order: 3
---

# Svelte API

## operationStore

Accepts three arguments as inputs, where only the first one — `query` — is required.

| Argument    | Type                     | Description                                                                        |
| ----------- | ------------------------ | ---------------------------------------------------------------------------------- |
| `query`     | `string \| DocumentNode` | The query to be executed. Accepts as a plain string query or GraphQL DocumentNode. |
| `variables` | `?object`                | The variables to be used with the GraphQL request.                                 |
| `context`   | `?object`                | Holds the contextual information for the query.                                    |

This is a [Svelte Writable Store](https://svelte.dev/docs#writable) that is used by other utilities
listed in these docs to read [`Operation` inputs](./core.md#operation) from and write
[`OperationResult` outputs](./core.md#operationresult) to.

The store has several properties on its value. The **writable properties** of it are inputs that are
used by either [`query`](#query), [`mutation`](#mutation), or [`subscription`](#subscription) to
create an [`Operation`](./core.md#operation) to execute. These are `query`, `variables`, and
`context`; the same properties that the `operationStore` accepts as arguments on creation.

Additionally the `context` may have a `pause: boolean` property that instructs the `query` and
`subscription` operations to pause execution and freeze the result.

Furthermore the store exposes some **readonly properties** which represent the operation's progress
and [result](./core.md#operationresult).

| Prop         | Type                   | Description                                                                                                                                        |
| ------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data`       | `?any`                 | Data returned by the specified query                                                                                                               |
| `error`      | `?CombinedError`       | A [`CombinedError`](./core.md#combinederror) instances that wraps network or `GraphQLError`s (if any)                                              |
| `extensions` | `?Record<string, any>` | Extensions that the GraphQL server may have returned.                                                                                              |
| `stale`      | `boolean`              | A flag that may be set to `true` by exchanges to indicate that the `data` is incomplete or out-of-date, and that the result will be updated soon.  |
| `fetching`   | `boolean`              | A flag that indicates whether the operation is currently in progress, which means that the `data` and `error` is out-of-date for the given inputs. |

All of the writable properties are updatable either via the common Svelte Writable's `set` or
`update` methods or directly. The `operationStore` exposes setters for the writable properties which
will automatically update the store and notify reactive subscribers.

In development, trying to update the _readonly_ properties directly or via the `set` or `update`
method will result in a `TypeError` being thrown.

An additional non-standard method on the store is `reexecute`, which does _almost_ the same as
assigning a new context to the operation. It is syntactic sugar to ensure that an operation may be
reexecuted at any point in time:

```js
operationStre(...).reexecute();
operationStre(...).reexecute({ requestPolicy: 'network-only' });
```

[Read more about `writable` stores on the Svelte API docs.](https://svelte.dev/docs#writable)

## query

The `query` utility function only accepts an `operationStore` as its only argument. Per
`operationStore` it should only be called once per component as it lives alongside the component and
hooks into its `onDestroy` lifecycle method. This means that we must avoid passing a reactive
variable to it, and instead must pass the raw `operationStore`.

This function will return the `operationStore` itself that has been passed.

[Read more about how to use the `query` API on the "Queries" page.](../basics/svelte.md#queries)

## subscription

The `subscription` utility function accepts an `operationStore` as its first argument, like the
[`query` function](#query). It should also per `operationStore` be called once per component.

The function also optionally accepts a second argument, a `handler` function. This function has the
following type signature:

```js
type SubscriptionHandler<T, R> = (previousData: R | undefined, data: T) => R;
```

This function will be called with the previous data (or `undefined`) and the new data that's
incoming from a subscription event, and may be used to "reduce" the data over time, altering the
value of `result.data`.

`subscription` itself will return the `operationStore` that has been passed when called.

[Read more about how to use the `subscription` API on the "Subscriptions"
page.](../advanced/subscriptions.md#svelte)

## mutation

The `mutation` utility function either accepts an `operationStore` as its only argument or an object
containing `query`, `variables`, and `context` properties. When it receives the latter it will
create an `operationStore` automatically.

The function will return an `executeMutation` callback, which can be used to trigger the mutation.
This callback optionally accepts a `variables` argument and a `context` argument of type
[`Partial<OperationContext>`](./core.md#operationcontext). If these arguments are passed, they will
automatically update the `operationStore` before starting the mutation.

The `executeMutation` callback will return a promise which resolves to the `operationStore` once the
mutation has been completed.

[Read more about how to use the `mutation` API on the "Mutations"
page.](../basics/svelte.md#mutations)

## Context API

In Svelte the [`Client`](./core.md#client) is passed around using [Svelte's Context
API](https://svelte.dev/tutorial/context-api). `@urql/svelte` wraps around Svelte's
[`setContext`](https://svelte.dev/docs#setContext) and
[`getContext`](https://svelte.dev/docs#getContext) functions and exposes:

- `setClient`
- `getClient`
- `initClient` (a shortcut for `createClient` + `setClient`)
