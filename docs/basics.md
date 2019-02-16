# Basics

Much of `urql` is about being flexible and customisable.
To this extent a large chunk of this document is dedicated to
how `urql` works and how to adapt it to different use cases.

If you wish to use `urql` without any customisations, this
document is entirely optional for you. But it's still worth
the read. Promised.

## Architecture

`urql`'s core parts are separated into three concepts:
**operations & results**, **the client**, and **exchanges**.

### Requests

Every GraphQL Request starts as a collection of just a
query and variables, which are supposed to be sent to
a GraphQL API (presumably). Those are objects that
tie the two together.

```js
type GraphQLRequest = {
  query: string,
  variables?: object,
};
```

To begin sending a GraphQL request the **client** has
[three main methods](https://github.com/FormidableLabs/urql/blob/master/src/client.ts)
that are responsible to provide this **input**.

- `executeQuery`
- `executeSubscription`
- `executeMutation`

All of these can be called with a `GraphQLRequest` as
the first argument and optionally accept some additional
"context" information. The method that was called determined
the operation that is then sent.

> _Note:_ In GraphQL and in `urql` the term "query" can be ambiguous.
> It is used to refer to a string composed in the
> [query language](https://facebook.github.io/graphql/June2018/#sec-Overview)
> but also one of the
> [three basic operations](https://facebook.github.io/graphql/June2018/#sec-Language.Operations).

### Operations

The client will enrich every request with meta information,
the result of which is called an **operation**. You can think
of them as the actual input of the eventual GraphQL request.

All bits that are added to a request to form an **operation**
are there to inform what should happen to it. It determines
how the network request should be sent and how the cache
should behave.

The shape of an operation extends the shape of a GraphQL Request:

```js
type Operation = {
  // GraphQLRequest:
  query: string,
  variables?: object

  // The rest:
  key: string,
  operationName: OperationType,
  context: OperationContext
}
```

The `OperationType` here is simply one of the three basic
GraphQL operations: `'subscription'`, `'query'`, or `'mutation'`.
Additionally there's an internal operation type called `'teardown'`
which is used to **cancel** all ongoing work for a previous operation
and free its resources.

If we call `executeQuery({ query: '{ content }' })`, the client
will internally dispatch the following operation:

```js
const exampleOperation = {
  query: '{ content }',
  variables: undefined,

  key: '[KEY]',
  operationName: 'query',
  context: {},
};
```

The `key` property will become a unique identifier of the GraphQL Request.
It's a hash of the exact `query` and `variables` combination, i.e. a
unique string for this request.

The `context` contains some more information and can be extended with
the second argument to `executeQuery`. By default it contains:

- `fetchOptions` for the `fetch` call's options
- `url` for the `fetch` call's API endpoint
- `requestPolicy` to determine the cache's behaviour

The `executeQuery` call will return a [Wonka](https://github.com/kitten/wonka)
stream. This is just an observable (not following the Observable spec)
that sends back the GraphQL request's result (an **"Operation Result"**).
When all consumers unsubscribe from this stream however, it'll terminate
any ongoing requests for this operation and free resources.

This is done by sending the exact same operation as above (`exampleOperation`)
but with the `'teardown'` operation name:

```js
const teardownOperation = {
  ...exampleOperation,
  operationName: 'teardown',
};
```

### Exchanges

The next bit of `urql`'s inner workings is how these operations are handled.
When a `new Client()` is created you may pass it `url` and `fetchOptions`.
But you can also pass an `exchanges` array.

**Exchanges** are operation handlers. It'll receive the `client` and a `forward`
function as an object. It then returns a function accepting a stream of
operations and returning a stream of operation results (i.e. GraphQL results).

In other words, exchanges are handlers that fulfill our GraphQL requests.
They're Input/Output streams, inputs being operations, outputs being results.
They're also composable. The `forward` function that an **exchange** receives
is just another Input/Output handler.

In practice the signature is:

```js
type ExchangeInput = { forward: ExchangeIO, client: Client };

type Exchange = (input: ExchangeInput) => ExchangeIO;
type ExchangeIO = (Source<Operation>) => Source<OperationResult>;
```

The simplest yet useful exchange would be one that accepts all operations and
immediately sends them to a GraphQL API with a fetch call. And in fact,
that is what the default `fetchExchange` does.

The default exchanges that a client will create when custom no `exchanges`
are passed to it are:

- `dedupExchange`: Deduplicates pending operations (pending = waiting for a response)
- `cacheExchange`: All caching logic for operations and results
- `fetchExchange`: Sends an operation to the API and returns results

The `client` accepts exchanges and composes them using the `composeExchanges` function
that is also exported by `urql`.

In essence these exchanges build a pipeline that runs in the order in which the
exchanges are in the list above.

**First,** ongoing operations are deduplicated. It wouldn't make sense to send the
same operation / request twice at the same time.

**Second,** operations are checked against the cache. Depending on the `requestPolicy`
cached results can be resolved instead and results from network requests are cached.

**Third,** operations are sent to the API and the result is normalised.

### Operation Results

Every operation that enters the exchange pipeline will receive a result, either
immediately (read: synchronously) or eventually as the result of a network
request comes in.

The raw GraphQL result from an API is typically: `{ data?: T, errors?: GraphQLError[] }`.
And `urql`'s operation results are very similar: `{ data?: T, error?: CombinedError }`.

The [`CombinedError` is a very simple wrapper](https://github.com/FormidableLabs/urql/blob/master/src/utils/error.ts)
that has either a `networkError` property with any unexpected errors that might occur,
or a `graphQLErrors` array with the list of errors that have been returned by the API.

This is a convenience wrapper that helps when the specific _kind of error_ that has occured
does not matter.

Additionally `urql`'s operation results will also have the `operation` property, which
just contains the original operation itself, which is how the client can tell which result
it has just received.
