---
title: Authoring Exchanges
order: 8
---

# Exchange Author Guide

As we've learned [on the "Architecture" page](../architecture.md) page, `urql`'s `Client` structures
its data as an event hub. We have an input stream of operations, which are instructions for the
`Client` to provide a result. These results then come from an output stream of operation results.

_Exchanges_ are responsible for performing the important transform from the operations (input) stream
to the results stream. Exchanges are handler functions that deal with these input and
output streams. They're one of `urql`'s key components, and are needed to implement vital pieces of
logic such as caching, fetching, deduplicating requests, and more. In other words, Exchanges are
handlers that fulfill our GraphQL requests and can change the stream of operations or results.

In this guide we'll learn more about how exchanges work and how we can write our own exchanges.

## An Exchange Signature

Exchanges are akin to [middleware in
Redux](https://redux.js.org/advanced/middleware) due to the way that they apply transforms.

```ts
import { Client, Operation, OperationResult } from '@urql/core';

type ExchangeInput = { forward: ExchangeIO; client: Client };
type Exchange = (input: ExchangeInput) => ExchangeIO;
type ExchangeIO = (ops$: Source<Operation>) => Source<OperationResult>;
```

The first parameter to an exchange is a `forward` function that refers to the next Exchange in the
chain. The second second parameter is the `Client` being used. Exchanges always return an `ExchangeIO`
function (this applies to the `forward` function as well), which accepts the source of
[_Operations_](../api/core.md#operation) and returns a source of [_Operation
Results_](../api/core.md#operationresult).

- [Read more about streams on the "Architecture" page.](../architecture.md#stream-patterns-in-urql)
- [Read more about the _Exchange_ type signature on the API docs.](../api/core.md#exchange)

## Using Exchanges

The `Client` accepts an `exchanges` option that. Initially, we may choose to just
set this to two very standard exchanges — `cacheExchange` and `fetchExchange`.

In essence these exchanges build a pipeline that runs in the order they're passed; _Operations_ flow
in from the start to the end, and _Results_ are returned through the chain in reverse.

Suppose we pass the `cacheExchange` and then the `fetchExchange` to the `exchanges`.

**First,** operations are checked against the cache. Depending on the `requestPolicy`,
cached results can be resolved from here instead, which would mean that the cache sends back the
result, and the operation doesn't travel any further in the chain.

**Second,** operations are sent to the API, and the result is turned into an `OperationResult`.

**Lastly,** operation results then travel through the exchanges in _reverse order_, which is because
exchanges are a pipeline where all operations travel forward deeper into the exchange chain, and
then backwards. When these results pass through the cache then the `cacheExchange` stores the
result.

```js
import { Client, fetchExchange, cacheExchange } from 'urql';

const client = new Client({
  url: 'http://localhost:3000/graphql',
  exchanges: [cacheExchange, fetchExchange],
});
```

We can add more exchanges to this chain, for instance, we can add the `mapExchange`, which can call a
callback whenever it sees [a `CombinedError`](../basics/errors.md) occur on a result.

```js
import { Client, fetchExchange, cacheExchange, mapExchange } from 'urql';

const client = new Client({
  url: 'http://localhost:3000/graphql',
  exchanges: [
    cacheExchange,
    mapExchange({
      onError(error) {
        console.error(error);
      },
    }),
    fetchExchange,
  ],
});
```

This is an example for adding a synchronous exchange to the chain that only reacts to results. It
doesn't add any special behavior for operations travelling through it. An example for an
asynchronous exchange that looks at both operations and results [we may look at the `retryExchange`
which retries failed operations.](../advanced/retry-operations.md)

## The Rules of Exchanges

Before we can start writing some exchanges, there are a couple of consistent patterns and limitations that
must be adhered to when writing an exchange. We call these the "rules of Exchanges", which
also come in useful when trying to learn what Exchanges actually are.

For reference, this is a basic template for an exchange:

```js
const noopExchange = ({ client, forward }) => {
  return operations$ => {
    // <-- The ExchangeIO function
    const operationResult$ = forward(operations$);
    return operationResult$;
  };
};
```

This exchange does nothing else than forward all operations and return all results. Hence, it's
called a `noopExchange` — an exchange that doesn't do anything.

### Forward and Return Composition

When you create a `Client` and pass it an array of exchanges, `urql` composes them left-to-right.
If we look at our previous `noopExchange` example in context, we can track what it does if it is located between the `cacheExchange` and the `fetchExchange`.

```js
import { Client, cacheExchange, fetchExchange } from 'urql';

const noopExchange = ({ client, forward }) => {
  return operations$ => {
    // <-- The ExchangeIO function
    // We receive a stream of Operations from `cacheExchange` which
    // we can modify before...
    const forwardOperations$ = operations$;

    // ...calling `forward` with the modified stream. The `forward`
    // function is the next exchange's `ExchangeIO` function, in this
    // case `fetchExchange`.
    const operationResult$ = forward(operations$);

    // We get back `fetchExchange`'s stream of results, which we can
    // also change before returning, which is what `cacheExchange`
    // will receive when calling `forward`.
    return operationResult$;
  };
};

const client = new Client({
  exchanges: [cacheExchange, noopExchange, fetchExchange],
});
```

### How to Avoid Accidentally Dropping Operations

Typically the `operations$` stream will send you `query`, `mutation`,
`subscription`, and `teardown`. There is no constraint for new operations
to be added later on or a custom exchange adding new operations altogether.

This means that you have to take "unknown" operations into account and
not `filter` operations too aggressively.

```js
import { pipe, filter, merge } from 'wonka';

// DON'T: drop unknown operations
({ forward }) =>
  operations$ => {
    // This doesn't handle operations that aren't queries
    const queries = pipe(
      operations$,
      filter(op => op.kind === 'query')
    );
    return forward(queries);
  };

// DO: forward operations that you don't handle
({ forward }) =>
  operations$ => {
    const queries = pipe(
      operations$,
      filter(op => op.kind === 'query')
    );
    const rest = pipe(
      operations$,
      filter(op => op.kind !== 'query')
    );
    return forward(merge([queries, rest]));
  };
```

If operations are grouped and/or filtered by what the exchange is handling, then it's also important to
make that any streams of operations not handled by the exchange should also be forwarded.

### Synchronous first, Asynchronous last

By default exchanges and Wonka streams are as predictable as possible.
Every operator in Wonka runs synchronously until asynchronicity is introduced.

This may happen when using a timing utility from Wonka, like
[`delay`](https://wonka.kitten.sh/api/operators#delay) or
[`throttle`](https://wonka.kitten.sh/api/operators#throttle)
This can also happen because the exchange inherently does something asynchronous, like fetching some
data or using a promise.

When writing exchanges, some will inevitably be asynchronous. For example if
they're fetching results, performing authentication, or other tasks
that you have to wait for.

This can cause problems, because the behavior in `urql` is built
to be _synchronous_ first. This is very helpful for suspense mode and allowing components receive cached data on their initial
mount without rerendering.

This why **all exchanges should be ordered synchronous first and
asynchronous last**.

What we for instance repeat as the default setup in our docs is this:

```js
import { Client, cacheExchange, fetchExchange } from 'urql';

new Client({
  // ...
  exchanges: [cacheExchange, fetchExchange];
});
```

The `cacheExchange` is completely synchronous.
The `fetchExchange` is asynchronous since it makes a `fetch` request and waits for a server response.
If we put an asynchronous exchange in front of the `cacheExchange`, that would be unexpected, and
since all results would then be delayed, nothing would ever be "cached" and instead always take some
amount of time to be returned.

When you're adding more exchanges, it's often crucial
to put them in a specific order. For instance, an authentication exchange
will need to go before the `fetchExchange`, a secondary cache will probably have to
go in front of the default cache exchange.

To ensure the correct behavior of suspense mode and
the initialization of our hooks, it's vital to order exchanges
so that synchronous ones come before asynchronous ones.
