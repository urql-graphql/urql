---
title: '@urql/vue'
order: 3
---

# Vue API

> **Note:** These API docs are deprecated as we now keep TSDocs in all published packages.
> You can view TSDocs while using these packages in your editor, as long as it supports the
> TypeScript Language Server.
> We're planning to replace these API docs with a separate web app soon.

## useQuery

Accepts a single required options object as an input with the following properties:

| Prop            | Type                     | Description                                                                                              |
| --------------- | ------------------------ | -------------------------------------------------------------------------------------------------------- |
| `query`         | `string \| DocumentNode` | The query to be executed. Accepts as a plain string query or GraphQL DocumentNode.                       |
| `variables`     | `?object`                | The variables to be used with the GraphQL request.                                                       |
| `requestPolicy` | `?RequestPolicy`         | An optional [request policy](./core.md#requestpolicy) that should be used specifying the cache strategy. |
| `pause`         | `?boolean`               | A boolean flag instructing [execution to be paused](../basics/vue.md#pausing-usequery).                  |
| `context`       | `?object`                | Holds the contextual information for the query.                                                          |

Each of these inputs may also be [reactive](https://v3.vuejs.org/api/refs-api.html) (e.g. a `ref`)
and are allowed to change over time which will issue a new query.

This function returns an object with the shape of an [`OperationResult`](./core.md#operationresult)
with an added `fetching` property, indicating whether the query is currently being fetched and an
`isPaused` property which will indicate whether `useQuery` is currently paused and won't
automatically start querying.

All of the properties on this result object are also marked as
[reactive](https://v3.vuejs.org/api/refs-api.html) using `ref` and will update accordingly as the
query is executed.

The result furthermore carries several utility methods:

| Method               | Description                                                                                                                                                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pause()`            | This will pause automatic querying, which is equivalent to setting `pause.value = true`                                                                                                                                            |
| `resume()`           | This will resume a paused automatic querying, which is equivalent to setting `pause.value = false`                                                                                                                                 |
| `executeQuery(opts)` | This will execute a new query with the given partial [`Partial<OperationContext>`](./core.md#operationcontext) regardless of whether the query is currently paused or not. This also returns the result object again for chaining. |

Furthermore the returned result object of `useQuery` is also a `PromiseLike`, which allows you to
take advantage of [Vue 3's experimental Suspense feature.](https://vuedose.tips/go-async-in-vue-3-with-suspense/)
When the promise is used, e.g. you `await useQuery(...)` then the `PromiseLike` will only resolve
once a result from the API is available.

[Read more about how to use the `useQuery` API on the "Queries" page.](../basics/vue.md#queries)

## useMutation

Accepts a single `query` argument of type `string | DocumentNode` and returns a result object with
the shape of an [`OperationResult`](./core.md#operationresult) with an added `fetching` property.

All of the properties on this result object are also marked as
[reactive](https://v3.vuejs.org/api/refs-api.html) using `ref` and will update accordingly as the
mutation is executed.

The object also carries a special `executeMutation` method, which accepts variables and optionally a
[`Partial<OperationContext>`](./core.md#operationcontext) and may be used to start executing a
mutation. It returns a `Promise` resolving to an [`OperationResult`](./core.md#operationresult)

[Read more about how to use the `useMutation` API on the "Mutations"
page.](../basics/vue.md#mutations)

## useSubscription

Accepts a single required options object as an input with the following properties:

| Prop        | Type                     | Description                                                                             |
| ----------- | ------------------------ | --------------------------------------------------------------------------------------- |
| `query`     | `string \| DocumentNode` | The query to be executed. Accepts as a plain string query or GraphQL DocumentNode.      |
| `variables` | `?object`                | The variables to be used with the GraphQL request.                                      |
| `pause`     | `?boolean`               | A boolean flag instructing [execution to be paused](../basics/vue.md#pausing-usequery). |
| `context`   | `?object`                | Holds the contextual information for the subscription.                                  |

Each of these inputs may also be [reactive](https://v3.vuejs.org/api/refs-api.html) (e.g. a `ref`)
and are allowed to change over time which will issue a new query.

`useSubscription` also optionally accepts a second argument, which may be a handler function with
a type signature of:

```js
type SubscriptionHandler<T, R> = (previousData: R | undefined, data: T) => R;
```

This function will be called with the previous data (or `undefined`) and the new data that's
incoming from a subscription event, and may be used to "reduce" the data over time, altering the
value of `result.data`.

This function returns an object with the shape of an [`OperationResult`](./core.md#operationresult)
with an added `fetching` property, indicating whether the subscription is currently running and an
`isPaused` property which will indicate whether `useSubscription` is currently paused.

All of the properties on this result object are also marked as
[reactive](https://v3.vuejs.org/api/refs-api.html) using `ref` and will update accordingly as the
query is executed.

The result furthermore carries several utility methods:

| Method                      | Description                                                                                                                                                                                                                                    |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pause()`                   | This will pause the subscription, which is equivalent to setting `pause.value = true`                                                                                                                                                          |
| `resume()`                  | This will resume the subscription, which is equivalent to setting `pause.value = false`                                                                                                                                                        |
| `executeSubscription(opts)` | This will start a new subscription with the given partial [`Partial<OperationContext>`](./core.md#operationcontext) regardless of whether the subscription is currently paused or not. This also returns the result object again for chaining. |

[Read more about how to use the `useSubscription` API on the "Subscriptions"
page.](../advanced/subscriptions.md#vue)

## useClientHandle

The `useClientHandle()` function may, like the other `use*` functions, be called either in
`setup()` or another lifecycle hook, and returns a so called "client handle". Using this `handle` we
can access the [`Client`](./core.md#client) directly via the `client` property or call the other
`use*` functions as methods, which will be directly bound to this `client`. This may be useful when
chaining these methods inside an `async setup()` lifecycle function.

| Method                 | Description                                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `client`               | Contains the raw [`Client`](./core.md#client) reference, which allows the `Client` to be used directly.                   |
| `useQuery(...)`        | Accepts the same arguments as the `useQuery` function, but will always use the `Client` from the handle's context.        |
| `useMutation(...)`     | Accepts the same arguments as the `useMutation` function, but will always use the `Client` from the handle's context.     |
| `useSubscription(...)` | Accepts the same arguments as the `useSubscription` function, but will always use the `Client` from the handle's context. |

## Context API

In Vue the [`Client`](./core.md#client) is provided either to your app or to a parent component of a
given subtree and is then subsequently injected whenever one of the above composition functions is
used.

You can provide the `Client` from any of your components using the `provideClient` function.
Alternatively, `@urql/vue` also has a default export of a [Vue Plugin function](https://v3.vuejs.org/guide/plugins.html#using-a-plugin).

Both `provideClient` and the plugin function either accept an [instance of
`Client`](./core.md#client) or the same options that `createClient` accepts as inputs.
