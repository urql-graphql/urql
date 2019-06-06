---
title: API
order: 4
---

<a name="api"></a>

# API

## React components and hooks

### `useQuery` (hook)

Accepts a single options object as input:

```js
interface UseQueryArgs {
  query: string;
  variables?: any;
  requestPolicy?: RequestPolicy;
  pause?: boolean;
}
```

And returns a tuple of the current query's state and
an `executeQuery` function.

The current state's shape is:

```js
interface UseQueryState<T> {
  fetching: boolean;
  data?: T;
  error?: CombinedError;
}
```

And the `executeQuery` function optionally
accepts a partial `OperationContext`.

[More information on how to use this hook can be found in the Getting Started section.](https://formidable.com/open-source/urql/docs/getting-started#writing-queries)

### `useMutation` (hook)

Accepts a single `query` argument of type `string`. And returns the
current mutation's state and an `executeMutation` function in a tuple. The
mutation is not started unless `executeMutation` has been called.

The use of the state is optional as `executeMutation` returns promise
resolving to the `OperationResult` itself.

The current mutation state's shape is:

```js
interface UseMutationState<T> {
  fetching: boolean;
  data?: T;
  error?: CombinedError;
}
```

The `executeMutation` function accepts the `variables` of type `object`.

[More information on how to use this hook can be found in the Getting Started section.](https://formidable.com/open-source/urql/docs/getting-started#writing-mutations)

### `useSubscription` (hook)

Accepts an options argument as its first input, and a second optional argument that is
the subscription handler function.

The options argument shape is:

```js
interface UseSubscriptionArgs {
  query: string;
  variables?: any;
}
```

And the handler has the signature:

```js
type SubscriptionHandler<T, R> = (prev: R | void, data: T) => R;
```

Meaning that the subscription handler receives the previous data or undefined
and the current, incoming subscription event data.

The hook returns a tuple of only its state:

```js
interface UseSubscriptionState<T> {
  data?: T;
  error?: CombinedError;
}
```

[More information on how to use this hook can be found in the Basics section.](https://formidable.com/open-source/urql/docs/basics#subscriptions)

### `Query` (component)

[More information on how to use this component can be found in the Getting Started section.](https://formidable.com/open-source/urql/docs/getting-started#writing-queries)

#### Props

| Prop          | Type                       | Description                                                                                           |
| ------------- | -------------------------- | ----------------------------------------------------------------------------------------------------- |
| query         | `string`                   | The GraphQL request's query                                                                           |
| variables     | `object`                   | The GraphQL request's variables                                                                       |
| requestPolicy | `?RequestPolicy`           | An optional request policy that should be used                                                        |
| pause         | `?boolean`                 | A boolean flag instructing `Query` to pause execution of the subsequent query operation               |
| children      | `RenderProps => ReactNode` | A function that follows the typical render props pattern. The shape of the render props is as follows |

#### Render Props

| Prop         | Type                                | Description                                                                                             |
| ------------ | ----------------------------------- | ------------------------------------------------------------------------------------------------------- |
| fetching     | `boolean`                           | Whether the `Query` is currently waiting for a GraphQL result                                           |
| data         | `?any`                              | The GraphQL request's result                                                                            |
| error        | `?CombinedError`                    | The `CombinedError` containing any errors that might've occured                                         |
| executeQuery | `Partial<OperationContext> => void` | A function that can force the operation to be sent again with the given context (Useful for refetching) |

### `Mutation` (component)

[More information on how to use this component can be found in the Getting Started section.](https://formidable.com/open-source/urql/docs/getting-started#writing-mutations)

#### Props

| Prop     | Type                       | Description                                                                                           |
| -------- | -------------------------- | ----------------------------------------------------------------------------------------------------- |
| query    | `string`                   | The GraphQL request's query                                                                           |
| children | `RenderProps => ReactNode` | A function that follows the typical render props pattern. The shape of the render props is as follows |

#### Render Props

| Prop            | Type                          | Description                                                      |
| --------------- | ----------------------------- | ---------------------------------------------------------------- |
| fetching        | `boolean`                     | Whether the `Mutation` is currently waiting for a GraphQL result |
| data            | `?any`                        | The GraphQL request's result                                     |
| error           | `?CombinedError`              | The `CombinedError` containing any errors that might've occured  |
| executeMutation | `(variables: object) => void` | A function that accepts variables and starts the mutation        |

### `Subscription` (component)

[More information on how to use this component can be found in the Basics section.](https://formidable.com/open-source/urql/docs/basics#subscriptions)

#### Props

| Prop      | Type                                      | Description                                                                                           |
| --------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| query     | `string`                                  | The GraphQL subscription's query                                                                      |
| variables | `object`                                  | The GraphQL subscriptions' variables                                                                  |
| handler   | `void \| (prev: R \| void, data: T) => R` | The handler that should combine/update the subscription's data with incoming data                     |
| children  | `RenderProps => ReactNode`                | A function that follows the typical render props pattern. The shape of the render props is as follows |

#### Render Props

| Prop     | Type             | Description                                                     |
| -------- | ---------------- | --------------------------------------------------------------- |
| fetching | `boolean`        | Whether the `Subscription` is currently ongoing                 |
| data     | `?any`           | The GraphQL subscription's data                                 |
| error    | `?CombinedError` | The `CombinedError` containing any errors that might've occured |

### Context components

`urql` comes with the two context components `Consumer` and `Provider` as returned
by React's `createContext` utility. It also exports the `Context` itself which can
be used in combination with the `useContext` hook.

## The Client and related types

### `Client` (class)

The client manages all operations and ongoing requests to the exchange pipeline.
It accepts a bunch of inputs when it's created

| Input        | Type                               | Description                                                                                                     |
| ------------ | ---------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| url          | `string`                           | The GraphQL API URL as used by `fetchExchange`                                                                  |
| fetchOptions | `RequestInit \| () => RequestInit` | Additional `fetchOptions` that `fetch` in `fetchExchange` should use to make a request                          |
| suspense     | `?boolean`                         | Activates the experimental React suspense mode, which can be used during server-side rendering to prefetch data |
| exchanges    | `Exchange[]`                       | An array of `Exchange`s that the client should use instead of the list of `defaultExchanges`                    |

`urql` also exposes `createClient()` that is just a convenient alternative to calling `new Client()`.

#### `.executeQuery()`, `.executeSubscription()`, and `.executeMutation()`

These methods are used by `<Query>` & `useQuery()`, `<Subscription>` & `useSubscription()`,
and `<Mutation>` & `useMutation()` respectively.

They accept a `GraphQLRequest` object as their first argument and optionally
a partial `OperationContext` as their second.

Internally they then create an `Operation` and call `.executeRequestOperation()` with
the `Operation`. This then returns a `Source<OperationResult>`, i.e. a stream of
`OperationResult`s.

#### `.executeRequestOperation()`

This method accepts an `Operation` and handles the flow of said `Operation`. Every `Operation`
that is executed must pass through this method.

It creates a filtered `Source<OperationResult>` that only contains the `OperationResult`s
relevant to this `Operation` by filtering by the operation `key` and track the subscriptions
to this `Source`.

This is important as a cache exchange can call `reexecuteOperation` to inform the
client about an invalidation. Whenever an operation needs to be updated with new
network data, it's important to know whether any component is still interested in
this operation.

To track this, this method ensures that a mapping is updated that counts up
for each subscription to the `Source` and counts down for each unsubscription.

The `Operation` that has been passed to this method will be dispatched
when the first subscription is started. When the last subscription unsubscribes
from the returned source, this method will ensure that a `teardown` operation
is dispatched.

> _Note:_ This does not apply to mutations, which are one-off calls and
> hence aren't shared, cancelled, or tracked in the cache.

The return value is the filtered `Source<OperationResult>`.

#### `.reexecuteOperation()`

This method accepts an `Operation` and will dispatch this `Operation` if there
are any subscriptions from `executeRequestOperation`'s `Source<OperationResult>`
to this particular `Operation`.

This is called by `cacheExchange` when an `Operation`'s `OperationResult` is
invalidated in the cache.

#### `.createRequestOperation()`

This is called by the `executeQuery`, `executeSubscription` and `executeMutation`
methods to create `Operation`s. It accepts:

- `OperationType`
- `GraphQLRequest`
- and; the optional partial `OperationContext` (`Partial<OperationContext>`)

It returns an `Operation`.

#### `.dispatchOperation()`

This method dispatches an `Operation` to the exchange pipeline. This is only
used directly by the Client and shouldn't normally be called externally, except
when the tracking logic of active `Operation`s needs to be bypassed.

These `Operation`s are streamed from the `operations$: Source<Operation>` stream.
The results of all exchanges are similarly output to `results$: Source<OperationResult>`.

### `OperationType` (type)

This determines what _kind of operation_ the exchanges need to perform.
This can either be:

- `'subscription'`
- `'query'`
- `'mutation'`
- or; `'teardown'`

The `'teardown'` operation is special in that it instructs exchanges to cancel
any ongoing operations with the same key as the `'teardown'` operation that is
received.

### `RequestPolicy` (type)

This determines the strategy that a cache exchange should use to fulfill an operation.
When you implement a custom cache exchange it's recommended that these policies are
handled.

- `'cache-first'` (default)
- `'cache-only'`
- `'network-only'`
- `'cache-and-network'`

### `GraphQLRequest` (type)

This often comes up as the **input** for every GraphQL request.
It consists of `query` and optional `variables`.

```js
type Operation = {
  query: string | DocumentNode,
  variables?: object,
  key: number,
};
```

As can be seen it also carries a `key` property. This property
is a hash of both the `query` and the `variables`, to uniquely
identify the request.

### `OperationContext` (type)

This type is used to give an operation additional metadata and information.

```js
type OperationContext = {
  fetchOptions?: RequestInit,
  requestPolicy: RequestPolicy,
  url: string,
  [key: string]: any,
};
```

It contains a lot of the above mentioned Client options and also `requestPolicy`.
It accepts additional, untyped parameters that can be used to send more
information to custom exchanges.

### `Operation` (type)

The input for every exchange that informs GraphQL requests.
it's essentially an extension of the `GraphQLRequest`.

```js
type Operation = {
  query: DocumentNode,
  variables?: object,
  key: number,
  operationName: OperationType,
  context: OperationContext,
};
```

The `key` value is a "hash" of `query` and `variables` or another string that
unique identifies the combination of the two.

### `OperationResult` (type)

The result of every GraphQL request, i.e. an `Operation`.
It's very similar to what comes back from a typical GraphQL API, but
slightly enriched.

```js
type OperationResult = {
  operation: Operation, // The operation that this result is a response for
  data?: any,
  error?: CombinedError,
};
```

### `CombinedError` (class)

| Input         | Type                             | Description                                                                       |
| ------------- | -------------------------------- | --------------------------------------------------------------------------------- |
| networkError  | `?Error`                         | An unexpected error that might've occured when trying to send the GraphQL request |
| graphQLErrors | `?Array<string \| GraphQLError>` | GraphQL Errors (if any) that were returned by the GraphQL API                     |
| response      | `?any`                           | The raw response object (if any) from the `fetch` call                            |

These are both inputs and properties on the `CombinedError`. Additionally it exposes a default `message`
that combines all errors it has received.

This is on every `OperationResult` that has one or more errors and groups the usual `errors` property
that a GraphQL result might have normally.

## Exchanges and their utilities

### `ExchangeInput` (type)

```js
type ExchangeInput = {
  forward: ExchangeIO,
  client: Client,
};
```

### `ExchangeIO` (type)

A function that receives a stream of operations and must return a stream
of results.

```js
type ExchangeIO = (Source<Operation>) => Source<OperationResult>;
```

### `Exchange` (type)

Similar to `redux-observable`'s epics, kind of related to Apollo's links,
also somehow similar to Express' middleware.

```js
type Exchange = ExchangeInput => ExchangeIO;
```

This works since every exchange receives `forward` with the `ExchangeInput`.
Exchanges can therefore be chained. They can alter and filter `Operation`s
that go into the next exchange, and they can alter, filter, or return
`OperationResult`s that are returned.

### `composeExchanges` (function)

This utility accepts multiple exchanges and composes them into a single one.
It chains them in the order that they're given, left to right.

```js
function composeExchanges(Exchange[]): Exchange;
```

This can be used to combine some exchanges and is also used by `Client`
to handle the `exchanges` input.

### `cacheExchange` (Exchange)

The `cacheExchange` as [described in the Basics section](https://formidable.com/open-source/urql/docs/basics#cacheexchange).
It's of type `Exchange`.

### `subscriptionExchange` (Exchange factory)

The `subscriptionExchange` as [described in the Basics section](https://formidable.com/open-source/urql/docs/basics#subscriptions).
It's of type `Options => Exchange`.

It accepts a single input: `{ forwardSubscription }`. This is a function that
receives an enriched operation and must return an Observable-like object that
streams `GraphQLResult`s with `data` and `errors`.

### `ssrExchange` (Exchange factory)

The `ssrExchange` as [described in the Basics section](https://formidable.com/open-source/urql/docs/basics#server-side-rendering).
It's of type `Options => Exchange`.

It accepts a single input, `{ initialState }`, which is completely
optional and populates the server-side rendered data with
a rehydrated cache.

This can be used to extract data that has been queried on
the server-side, which is also described in the Basics section,
and is also used on the client-side to restore server-side
rendered data.

When called, this function creates an `Exchange`, which also has
two methods on it:

- `.restoreData(data)` which can be used to inject data, typically
  on the client-side.
- `.extractData()` which is typically used on the server-side to
  extract the server-side rendered data.

Basically, the `ssrExchange` is a small cache that collects data
during the server-side rendering pass, and allows you to populate
the cache on the client-side with the same data.

During React rehydration this cache will be emptied and it will
become inactive and won't change the results of queries after
rehydration.

It needs to be used _after_ other caching Exchanges like the
`cacheExchange`, but before any _asynchronous_ Exchange like
the `fetchExchange`.

### `debugExchange` (Exchange)

An exchange that writes incoming `Operation`s to `console.log` and
writes completed `OperationResult`s to `console.log`.

### `dedupExchange` (Exchange)

An exchange that keeps track of ongoing `Operation`s that haven't returned had
a corresponding `OperationResult` yet. Any duplicate `Operation` that it
receives is filtered out if the same `Operation` has already been received
and is still waiting for a result.

### `fallbackExchangeIO` (ExchangeIO)

This is an `ExchangeIO` function that the `Client` adds on after all
exchanges. This function is responsible from filtering `teardown` operations
out of the output and also warns you of unhandled `operationName`s which
can occur when a subscription is used without adding a `subscriptionExchange`.

### `fetchExchange` (Exchange)

The `fetchExchange` as [described in the Basics section](https://formidable.com/open-source/urql/docs/basics#fetchexchange).
It's of type `Exchange`.

### `defaultExchanges` (Exchange[])

An array of the default exchanges that the `Client` uses when it wasn't passed
an `exchanges` option.

```js
const defaultExchanges = [dedupExchange, cacheExchange, fetchExchange];
```
