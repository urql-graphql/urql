---
title: Stream Patterns
order: 1
---

# Stream Patterns

As we've learned [on the last page](./philosophy.md), `urql`'s main way of handling GraphQL requests
is by abstracting them as streams of operations and results.

## Streams on the Client

Mainly, the client abstracts GraphQL requests as _Operations_, descriptions of the GraphQL request,
its query and variables, and also additional information that is configured on the `Client`, like
the `url` and `fetchOptions`.

![Operations stream and results stream](../assets/urql-client-architecture.png)

Internally the `Client` is an event hub. It defines a stream of operations as inputs, sends them
through a layer that will ultimately send GraphQL requests to an API, and then sends the results
onto another stream.

As a user, in framework code, we never interact with these streams directly, but they describe
every interaction between the declarative queries we write and how `urql` fulfills them.

## Streams in JavaScript

Generally we refer to _streams_ as abstractions that allow us to program with asynchronous streams of
events over time, but more specifically in JavaScript, we're thinking specifically of
[Observables](https://github.com/tc39/proposal-observable)
and [Reactive Programming with Observables.](http://reactivex.io/documentation/observable.html)

These concepts can be quite intimidating, if you're new to them, but from a high-level view what
we're talking about can be thought of as a "combination of Promises and Arrays".
Arrays because we're dealing with multiple items, and Promises because these items arrive
asynchronously.

Also most Observable libraries come with a toolkit of helper functions that are similar to the
methods on arrays, so you're likely to see `map` and `filter` — amongst other utlities — in those
libraries.

[Read this Gist for a more in-depth
explanation.](https://gist.github.com/staltz/868e7e9bc2a7b8c1f754)

## The Wonka library

`urql` utilises the [Wonka](https://github.com/kitten/wonka) library for its streams. It has a
couple of advantages that are specifically tailored for the `urql` library and ecosystem.

- It is extremely lightweight and treeshakeable, weighing around 3.7kB minzipped.
- It's cross-platform and cross-language compatible, having been written in
  [Reason](https://reasonml.github.io/) and providing support for [Flow](https://flow.org/)
  and [TypeScript](typescriptlang.org/).
- It's predictable and also an iterable toolchain, emitting synchronous events whenever possible.

Typical usage of Wonka will involve creating a _source_ of some values and a _sink_.

```js
import { fromArray, map, subscribe, pipe } from 'wonka';

const { unsubscribe } = pipe(
  fromArray([1, 2, 3]),
  map(x => x * 2),
  subscribe(x => {
    console.log(x); // 1, 2, 3
  })
);
```

In Wonka, like with Observables, streams are cancellable by calling `unsubscribe` that a
subscription returns.

[Read more about Wonka in its documentation.](https://wonka.kitten.sh/basics/background)

## The Client's query streams

Internally the `Client` has methods that may be used to execute queries, mutations, and
subscriptions. These methods typically return `Wonka` streams that when subscribed to will
emit results for a given query.

When a result can be retrieved from an in-memory cache, the stream may even emit the result
synchronously — rather than asynchronously.

There are three methods for each different type of operation that GraphQL supports, there's an
`executeQuery`, `executeMutation`, and `executeSubscription` method. All these methods are
convenience wrappers around `executeRequestOperation` that create an operation and return a stream.

There are also convenience wrappers around the "execute" methods that are useful when using `urql`
in a Node.js environment. Those are `query`, `mutation`, and `subscription`.

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

All methods on the `Client` internally emit an operation on an "operations stream" and the result
for this operation will be filtered out of all results and delivered to your stream.
There are several of these convenience methods in `urql` that make it easier to work with the
concept of GraphQL operation and result streams.

[Read more about the available APIs on the `Client` in the Core API docs.](../api/core.md)
