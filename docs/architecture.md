---
title: Architecture
order: 3
---

# Architecture

`urql` is a highly customizable and flexible GraphQL client, that happens to come with some default
[core behavior in the core package](./basics/core.md).

By default, `urql` aims to provide the minimal amount of features that allow us to build an app
quickly. However, `urql` has also been designed to be a GraphQL Client
that grows with our usage and demands. As we go from building our smallest or first GraphQL apps to
utilising its full functionality, we have tools at our disposal to extend and customize `urql` to
our liking.

## Using GraphQL Clients

You may have worked with a GraphQL API previously and noticed that using GraphQL in your app can be
as straightforward as sending a plain HTTP request with your query to fetch some data.

GraphQL also provides an opportunity to abstract away a lot of the manual work that goes with
sending these queries and managing the data. Ultimately, this lets you focus on building
your app without having to handle the technical details of state management in detail.

Specifically, `urql` simplifies three common aspects of using GraphQL:

- Sending queries and mutations and receiving results _declaratively_
- Abstracting _caching_ and state management internally
- Providing a central point of _extensibility_ and integration with your API

In the following sections we'll talk about the way that `urql` solves these three problems and how the logic abstracted away internally.

## Requests and Operations on the Client

If `urql` was a train it would take several stops to arrive at its terminus, our API. It starts with us
defining queries or mutations. Any GraphQL request can be abstracted into their query documents and
their variables. In `urql`, these GraphQL requests are treated as unique objects, which are uniquely
identified by the query document and variables (which is why a `key` is generated from the two). This
`key` is a hash number of the query document and variables and uniquely identifies our
[`GraphQLRequest`](./api/core.md#graphqlrequest).

Whenever we decide to send a request to our API we start by using `urql`'s
[`Client`](./api/core.md#client). It accepts several options like `url` or `requestPolicy` which are
extra information on how the GraphQL requests are executed.

```js
import { Client } from '@urql/core';

new Client({
  url: 'http://localhost:3000/graphql',
  requestPolicy: 'cache-first',
});
```

The bindings that we've seen in [the "Basics" section](./basics/README.md) interact with [the
`Client`](./api/core.md#client) directly and are a thin abstraction on top of it. Though some methods can be called on it directly, as seen [on the "Core Usage"
page](./basics/core.md#one-off-queries-and-mutations).

When we send our queries or mutations to the `Client`, internally they will be managed as
[`Operation`s.](./api/core.md#operation). An "Operation" is an extension of `GraphQLRequest`s. Not
only do they carry the `query`, `variables`, and a `key` property, they will also identify the
`kind` of operation that is executed, like `"query"` or `"mutation"`. We can also find the
`Client`'s options on `operation.context` which carries an operation's metadata.

![Operations and Results](./assets/urql-event-hub.png)

It's the `Client`s responsibility to accept an `Operation` and execute it. The bindings internally
call the `client.executeQuery`, `client.executeMutation`, or `client.executeSubscription` methods,
and we'll get a "stream" of results. This "stream" allows us to register a callback with it to
receive results.

In the diagram we can see that each operation is a signal for our request to start at which point
we can expect to receive our results eventually on a callback. Once we're not interested in results
anymore a special "teardown" signal is issued on the `Client`. While we don't see operations outside
the `Client`, they're what travel through the "Exchanges" on the `Client`.

## The Client and Exchanges

To reiterate, when we use `urql`'s bindings for our framework of choice, methods are called on the
`Client`, but we never see the operations that are created in the background from our bindings. We
call a method like `client.executeQuery` (or it's called for us in the bindings), an operation is
issued internally when we subscribe with a callback, and later our callback is called with results.

![Operations stream and results stream](./assets/urql-client-architecture.png)

While we know that, for us, we're only interested in a single [`Operation`](./api/core.md#operation)
and its [`OperationResult`s](./api/core.md#operationresult) at a time, the `Client` treats these as
one big stream. The `Client` sees an incoming flow of all of our operations.

As we've learned before, each operation carries a `key` and each result we receive carries the
original `operation`. Because an `OperationResult` also carries an `operation` property the `Client`
will always know which results correspond to an individual operation.
However, internally, all of our operations are processed at the same time concurrently. However, from
our perspective:

- We subscribe to a "stream" and expect to get results on a callback
- The `Client` issues the operation, and we'll receive some results back eventually as either the
  cache responds (synchronously), or the request gets sent to our API.
- We eventually unsubscribe, and the `Client` issues a "teardown" operation with the same `key` as
  the original operation, which concludes our flow.

The `Client` itself doesn't actually know what to do with operations. Instead, it sends them through
"exchanges". Exchanges are akin to [middleware in Redux](https://redux.js.org/advanced/middleware)
and have access to all operations and all results. Multiple exchanges are chained to process our
operations and to execute logic on them, one of them being the `fetchExchange`, which as the name
implies sends our requests to our API.

### How operations get to exchanges

We now know how we get to operations and to the `Client`:

- Any bindings or calls to the `Client` create an **operation**
- This operation identifies itself as either a `"query"`, `"mutation"` or `"subscription"` and has a
  unique `key`.
- This operation is sent into the **exchanges** and eventually ends up at the `fetchExchange`
  (or a similar exchange)
- The operation is sent to the API and a **result** comes back, which is wrapped in an `OperationResult`
- The `Client` filters the `OperationResult` by the `operation.key` and — via a callback — gives us
  a **stream of results**.

To come back to our train analogy from earlier, an operation, like a train, travels from one end
of the track to the terminus — our API. The results then come back on the same path as they're just
travelling the same line in reverse.

### The Exchanges

The default set of exchanges that `@urql/core` contains and applies to a `Client` are:

- `dedupExchange`: Deduplicates pending operations (pending = waiting for a result)
- `cacheExchange`: The default caching logic with ["Document Caching"](./basics/document-caching.md)
- `fetchExchange`: Sends an operation to the API using `fetch` and adds results to the output stream

When we don't pass the `exchanges` option manually to our `Client` then these are the ones that will
be applied. As we can see, an exchange exerts a lot of power over our operations and results. They
determine a lot of the logic of the `Client`, taking care of things like deduplication, caching, and
sending requests to our API.

Some of the exchanges that are available to us are:

- [`errorExchange`](./api/core.md#errorexchange): Allows a global callback to be called when any error occurs
- [`ssrExchange`](./advanced/server-side-rendering.md): Allows for a server-side renderer to
  collect results for client-side rehydration.
- [`retryExchange`](./advanced/retry-operations.md): Allows operations to be retried
- [`multipartFetchExchange`](./advanced/persistence-and-uploads.md#file-uploads): Provides multipart file upload capability
- [`persistedFetchExchange`](./advanced/persistence-and-uploads.md#automatic-persisted-queries): Provides support for Automatic
  Persisted Queries
- [`authExchange`](./advanced/authentication.md): Allows complex authentication flows to be implemented
  easily.
- [`requestPolicyExchange`](./api/request-policy-exchange.md): Automatically upgrades `cache-only` and `cache-first` operations to `cache-and-network` after a given amount of time.
- [`refocusExchange`](./api/refocus-exchange.md): Tracks open queries and refetches them
  when the window regains focus.
- `devtoolsExchange`: Provides the ability to use the [urql-devtools](https://github.com/urql-graphql/urql-devtools)

We can even swap out our [document cache](./basics/document-caching.md), which is implemented by
`@urql/core`'s `cacheExchange`, with `urql`'s [normalized cache,
Graphcache](./graphcache/README.md).

[Read more about exchanges and how to write them from scratch on the "Authoring Exchanges"
page.](./advanced/authoring-exchanges.md)

## Stream Patterns in `urql`

In the previous sections we've learned a lot about how the `Client` works, but we've always learned
it in vague terms — for instance, we've learned that we get a "stream of results" or `urql` sees all
operations as "one stream of operations" that it sends to the exchanges.
But, **what are streams?**

Generally we refer to _streams_ as abstractions that allow us to program with asynchronous events
over time. Within the context of JavaScript we're specifically thinking in terms of
[Observables](https://github.com/tc39/proposal-observable)
and [Reactive Programming with Observables.](http://reactivex.io/documentation/observable.html)
These concepts may sound intimidating, but from a high-level view what we're talking about can be
thought of as a combination of promises and iterables (e.g. arrays). We're dealing with multiple
events, but our callback is called over time. It's like calling `forEach` on an array but expecting
the results to come in asynchronously.

As a user, if we're using the one framework bindings that we've seen in [the "Basics"
section](./basics/README.md), we may never see these streams in action or may never use them even,
since the bindings internally use them for us. But if we [use the `Client`
directly](./basics/core.md#one-off-queries-and-mutations) or write exchanges then we'll see streams
and will have to deal with their API.

### The Wonka library

`urql` utilises the [Wonka](https://github.com/kitten/wonka) library for its streams. It has a
few advantages that are specifically tailored for the `urql` library and ecosystem:

- It is extremely lightweight and treeshakeable, with a size of around 3.7kB minzipped.
- It's cross-platform and cross-language compatible, having been written in
  [Reason](https://reasonml.github.io/) and provides support for [Flow](https://flow.org/)
  and [TypeScript](https://www.typescriptlang.org/v2/).
- It's a predictable and iterable toolchain, emitting synchronous events whenever possible.

Typical usage of Wonka will involve creating a _source_ of some values and a _sink_.

```js
import { fromArray, map, subscribe, pipe } from 'wonka';

const { unsubscribe } = pipe(
  fromArray([1, 2, 3]),
  map(x => x * 2),
  subscribe(x => {
    console.log(x); // 2, 4, 6
  })
);
```

In Wonka, like with Observables, streams are cancellable by calling the `unsubscribe` method that a
subscription returns.

[Read more about Wonka in its documentation](https://wonka.kitten.sh/basics/background).

### Stream patterns with the client

When we call methods on the `Client` like [`client.executeQuery`](./api/core.md#clientexecutequery)
or [`client.query`](./api/core.md#clientquery) then these will return a Wonka stream. Those are
essentially just a bunch of callbacks.

We can use [`wonka`'s `subscribe`](https://wonka.kitten.sh/api/sinks#subscribe) function to start
this stream. We pass this function a callback and will receive results back from the `Client`, as it
starts our operation. When we unsubscribe then the `Client` will stop this operation by sending a
special "teardown" operation to our exchanges.

```js
import { pipe, subscribe } from 'wonka';

const QUERY = `
  query Test($id: ID!) {
    getUser(id: $id) {
      id
      name
    }
  }
`;

const { unsubscribe } = pipe(
  client.query(QUERY, { id: 'test' }),
  subscribe(result => {
    console.log(result); // { data: ... }
  })
);
```

Read more about the available APIs on the `Client` in the [Core API docs](./api/core.md).
