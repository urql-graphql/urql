---
title: Stream Patterns
order: 1
---

# Stream Patterns

As we've learned [on the last page](./philosophy.md), `urql`'s main way of handling GraphQL requests
is by abstracting them as streams of operations and results

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
