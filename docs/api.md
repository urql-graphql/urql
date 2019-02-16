# API

## React components and hooks

### `useQuery` (hook)

Accepts a single options object as input:

```js
interface UseQueryArgs {
  query: string;
  variables?: any;
  requestPolicy?: RequestPolicy;
}
```

And returns a tuple of the current query's state and
an `excuteQuery` function.

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

[More information on how to use this hook can be found in the Getting Started section.](getting-started.md#writing-queries)

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

[More information on how to use this hook can be found in the Getting Started section.](getting-started.md#writing-mutations)

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

[More information on how to use this hook can be found in the Basics section.](basics.md#subscriptions)

### `Query` (component)

[More information on how to use this component can be found in the Getting Started section.](getting-started.md#writing-queries)

#### Props

| Prop          | Type                       | Description                                                                                           |
| ------------- | -------------------------- | ----------------------------------------------------------------------------------------------------- |
| query         | `string`                   | The GraphQL request's query                                                                           |
| variables     | `object`                   | The GraphQL request's variables                                                                       |
| requestPolicy | `?RequestPolicy`           | An optional request policy that should be used                                                        |
| children      | `RenderProps => ReactNode` | A function that follows the typical render props pattern. The shape of the render props is as follows |

#### Render Props

| Prop         | Type                                | Description                                                                                             |
| ------------ | ----------------------------------- | ------------------------------------------------------------------------------------------------------- |
| fetching     | `boolean`                           | Whether the `Query` is currently waiting for a GraphQL result                                           |
| data         | `?any`                              | The GraphQL request's result                                                                            |
| error        | `?CombinedError`                    | The `CombinedError` containing any errors that might've occured                                         |
| executeQuery | `Partial<OperationContext> => void` | A function that can force the operation to be sent again with the given context (Useful for refetching) |

### `Mutation` (component)

[More information on how to use this component can be found in the Getting Started section.](getting-started.md#writing-mutations)

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

[More information on how to use this component can be found in the Basics section.](basics.md#subscriptions)

#### Props

| Prop      | Type                                    | Description                                                                                           |
| --------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| query     | `string`                                | The GraphQL subscription's query                                                                      |
| variables | `object`                                | The GraphQL subscriptions' variables                                                                  |
| handler   | `void | (prev: R | void, data: T) => R` | The handler that should combine/update the subscription's data with incoming data                     |
| children  | `RenderProps => ReactNode`              | A function that follows the typical render props pattern. The shape of the render props is as follows |

#### Render Props

| Prop     | Type             | Description                                                     |
| -------- | ---------------- | --------------------------------------------------------------- |
| fetching | `boolean`        | Whether the `Subsription` is currently ongoing                  |
| data     | `?any`           | The GraphQL subscription's data                                 |
| error    | `?CombinedError` | The `CombinedError` containing any errors that might've occured |

## The Client and related types

### `Client` (class)

The client manages all operations and ongoing requests to the exchange pipeline.
It accepts a bunch of inputs when it's created

| Input        | Type                              | Description                                                                                  |
| ------------ | --------------------------------- | -------------------------------------------------------------------------------------------- |
| url          | `string`                          | The GraphQL API URL as used by `fetchExchange`                                               |
| fetchOptions | `RequestInit | () => RequestInit` | Additional `fetchOptions` that `fetch` in `fetchExchange` should use to make a request       |
| exchanges    | `Exchange[]`                      | An array of `Exchange`s that the client should use instead of the list of `defaultExchanges` |

`urql` also exposes `createClient()` that is just a convenient alternative to calling `new Client()`.

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
  query: string,
  variables?: object,
  key: string,
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

| Input         | Type                            | Description                                                                       |
| ------------- | ------------------------------- | --------------------------------------------------------------------------------- |
| networkError  | `?Error`                        | An unexpected error that might've occured when trying to send the GraphQL request |
| graphQLErrors | `?Array<string | GraphQLError>` | GraphQL Errors (if any) that were returned by the GraphQL API                     |
| response      | `?any`                          | The raw response object (if any) from the `fetch` call                            |

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

The `cacheExchange` as [described in the Basics section](basics.md#cacheexchange).
It's of type `Exchange`.

### `subscriptionExchange` (Exchange factory)

The `subscriptionExchange` as [described in the Basics section](basics.md#subscriptions).
It's of type `Options => Exchange`.

It accepts a single input: `{ forwardSubscription }`. This is a function that
receives an enriched operation and must return an Observable-like object that
streams `GraphQLResult`s with `data` and `errors`.

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

The `fetchExchange` as [described in the Basics section](basics.md#fetchexchange).
It's of type `Exchange`.

### `defaultExchanges` (Exchange[])

An array of the default exchanges that the `Client` uses when it wasn't passed
an `exchanges` option.

```js
const defaultExchanges = [dedupExchange, cacheExchange, fetchExchange];
```
