---
title: Architecture
order: 3
---

# Architecture

`urql` is a highly customizable and flexible GraphQL client.
As you use it in your app, it's split into three parts:

- Bindings — such as for React, Preact, Vue, or Svelte — which interact with `@urql/core`'s
  `Client`.
- The Client — as created [with the core `@urql/core` package](./basics/core.md), which interacts with "exchanges" to execute GraphQL
  operations, and which you can also use directly.
- Exchanges, which provide functionality like fetching or caching to the `Client`.

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

In the following sections we'll talk about the way that `urql` solves these three problems and how the logic is abstracted away internally.

## Requests and Operations on the Client

If `urql` was a train it would take several stops to arrive at its terminus, our API. It starts with us
defining queries or mutations by writing in GraphQL's query language.

Any GraphQL request can be abstracted into its query documents and its variables.

```js
import { gql } from '@urql/core';

const query = gql`
  query ($name: String!) {
    helloWorld(name: $name)
  }
`;

const request = createRequest(query, {
  name: 'Urkel',
});
```

In `urql`, these GraphQL requests are treated as unique objects and each GraphQL request will have
a `key` generated for them. This `key` is a hash of the query document and the variables you provide
and are set on the `key` property of a [`GraphQLRequest`](./api/core.md#graphqlrequest).

Whenever we decide to send our GraphQL requests to a GraphQL API we start by using `urql`'s
[`Client`](./api/core.md#client).
The `Client` accepts several options to configure its behaviour and the behaviour of exchanges,
like the `fetchExchange`. For instance, we can pass it a `url` which the `fetchExchange` will
use to make a `fetch` call to our GraphQL API.

```js
import { Client, cacheExchange, fetchExchange } from '@urql/core';

const client = new Client({
  url: 'http://localhost:3000/graphql',
  exchanges: [cacheExchange, fetchExchange],
});
```

Above, we're defining a `Client` that is ready to accept our requests. It will apply basic
document caching and will send uncached requests to the `url` we pass it.
The bindings that we've seen in [the "Basics" section](./basics/README.md), like `useQuery` for
React for example, interact with [the `Client`](./api/core.md#client) directly and are a thin
abstraction.

Some methods can be called on it directly however, as seen [on the "Core Usage"
page](./basics/core.md#one-off-queries-and-mutations).

```js
// Given our request and client defined above, we can call
const subscription = client.executeQuery(request).subscribe(result => {
  console.log(result.data);
});
```

As we've seen, `urql` defines our query documents and variables as
[`GraphQLRequest`s](./api/core.md#graphqlrequest). However, since we have more metadata that is
needed, like our `url` option on the `Client`, `urql` internally creates [`Operation`s](./api/core.md#operation)
each time a request is executed. The operations are then forwarded to the exchanges, like the
`cacheExchange` and `fetchExchange`.

An "Operation" is an extension of `GraphQLRequest`s. Not only do they carry the `query`, `variables`,
and a `key` property, they will also identify the `kind` of operation that is executed, like
`"query"` or `"mutation"`, and they contain the `Client`'s options on `operation.context`.

![Operations and Results](./assets/urql-event-hub.png)

This means, once we hand over a GraphQL request to the `Client`, it will create an `Operation`,
and then hand it over to the exchanges until a result comes back.

As shown in the diagram, each operation is like an event or signal for a GraphQL request to start,
and the exchanges will eventually send back a corresponding result.
However, because the cache can send updates to us whenever it detects a change, or you could cancel
a GraphQL request before it finishes, a special "teardown" `Operation` also exists, which cancels
ongoing requests.

## The Client and Exchanges

To reiterate, when we use `urql`'s bindings for our framework of choice, methods are called on the
`Client`, but we never see the operations that are created in the background from our bindings. We
call a method like `client.executeQuery` (or it's called for us in the bindings), an operation is
issued internally when we subscribe with a callback, and later, we're given results.

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

By default, the `Client` doesn't do anything with GraphQL requests. It contains only the logic to
manage and differentiate between active and inactive requests and converts them to operations.
To actually do something with our GraphQL requests, it needs _exchanges_, which are like plugins
that you can pass to create a pipeline of how GraphQL operations are executed.

By default, you may want to add the `cacheExchange` and the `fetchExchange` from `@urql/core`:

- `cacheExchange`: Caches GraphQL results with ["Document Caching"](./basics/document-caching.md)
- `fetchExchange`: Executes GraphQL requests with a `fetch` HTTP call

```js
import { Client, cacheExchange, fetchExchange } from '@urql/core';

const client = new Client({
  url: 'http://localhost:3000/graphql',
  exchanges: [cacheExchange, fetchExchange],
});
```

As we can tell, exchanges define not only how GraphQL requests are executed and handled, but also
get control over caching. Exchanges can be used to change almost any behaviour in the `Client`,
although internally they only handle incoming & outgoing requests and incoming & outgoing results.

Some more exchanges that we can use with our `Client` are:

- [`mapExchange`](./api/core.md#mapexchange): Allows changing and reacting to operations, results, and errors
- [`ssrExchange`](./advanced/server-side-rendering.md): Allows for a server-side renderer to
  collect results for client-side rehydration.
- [`retryExchange`](./advanced/retry-operations.md): Allows operations to be retried on errors
- [`persistedExchange`](./advanced/persistence-and-uploads.md#automatic-persisted-queries): Provides support for Automatic
  Persisted Queries
- [`authExchange`](./advanced/authentication.md): Allows refresh authentication to be implemented easily.
- [`requestPolicyExchange`](./api/request-policy-exchange.md): Automatically refreshes results given a TTL.
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

### Stream patterns with the client

When we call methods on the `Client` like [`client.executeQuery`](./api/core.md#clientexecutequery)
or [`client.query`](./api/core.md#clientquery) then these will return a "stream" of results.

It's normal for GraphQL subscriptions to deliver multiple results, however, even GraphQL queries can
give you multiple results in `urql`. This is because operations influence one another. When a cache
invalidates a query, this query may refetch, and a new result is delivered to your application.

Multiple results mean that once you subscribe to a GraphQL query via the `Client`, you may receive
new results in the future.

```js
import { gql } from '@urql/core';

const QUERY = gql`
  query Test($id: ID!) {
    getUser(id: $id) {
      id
      name
    }
  }
`;

client.query(QUERY, { id: 'test' }).subscribe(result => {
  console.log(result); // { data: ... }
});
```

Read more about the available APIs on the `Client` in the [Core API docs](./api/core.md).

Internally, these streams and all exchanges are written using a library called
[`wonka`](https://wonka.kitten.sh/basics/background), which is a tiny Observable-like
library. It is used to write exchanges and when we interact with the `Client` it is used internally
as well.
