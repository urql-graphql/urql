---
title: Exchanges
order: 3
---

# Exchanges

As we've learned [on the "Stream Patterns" page](./stream-patterns.md), `urql`'s `Client` structures
its data as an event hub. We have an input stream of operations, which are instructions for the
`Client` to provide a result. These results come from an output stream of operation results.

The important part how we get from the operations stream to the results stream, which is the
responsibility of _Exchanges_. _Exchanges_ are handler functions that deal with these input and
output streams. They're the main construct of `urql` to implement every piece of logic, like
caching, fetching, deduplicating requests, and more. In other words, _Exchanges_ are handlers that
fulfill our GraphQL requests and can change the stream of operations or results.

The default exchanges that `@urql/core` contains and applies by default to a `Client` without custom
exchanges are the:

- `dedupExchange`: Deduplicates pending operations (pending = waiting for a result)
- `cacheExchange`: The default caching logic with ["Document Caching"](../basics/document-caching.md)
- `fetchExchange`: Sends an operation to the API using `fetch` and adds results to the output stream

## An Exchange Signature

Because of how _Exchanges_ work they're akin to [middleware in
Redux](https://redux.js.org/advanced/middleware).

```ts
import { Client, Operation, OperationResult } from '@urql/core';

type ExchangeInput = { forward: ExchangeIO, client: Client };
type Exchange = (input: ExchangeInput) => ExchangeIO;
type ExchangeIO = (ops$: Source<Operation>) => Source<OperationResult>;
```

Their signature is a function that receives a `forward` function, which is the next _Exchange_ in a
chain of them and returns the `ExchangeIO` function, which accepts the source of _Operations_ and
returns a source of _Operation Results_:

## Using Exchanges

The `Client` accepts an `exchanges` option which is by default the list of default exchanges, as
discussed above. When we pass a custom list of exchanges the `Client` uses the `composeExchanges`
utiliy, which starts chaining these exchanges.

In essence these exchanges build a pipeline that runs in the order they're passed; _Operations_ flow
in from the start to the end, and _Results_ come back in reverse, through this chain.

If we look at our list of default exchanges — `dedupExchange`, `cacheExchange`, and then
`fetchExchange` — an incoming operation is treated as follows:

**First,** ongoing operations are deduplicated. It wouldn't make sense to send the
same operation / request twice at the same time.

**Second,** operations are checked against the cache. Depending on the `requestPolicy`
cached results can be resolved instead and results from network requests are cached.

**Third,** operations are sent to the API and the result is normalized. The result then travels
backwards through the returned stream of results.

## The Rules of Exchanges

Before we can start writing some exchanges, there are a couple of patterns and limitations that
always remain the same when writing an exchange. We call these the "rules of _Exchanges_", which
also come in useful when trying to learn what _Exchanges_ actually are.

For reference, this is a basic template for an exchange:

```js
const noopExchange = ({ client, forward }) => {
  return operation$ => { // <-- The ExchangeIO function
    const operationResult$ = forward(operations$);
    return operationResult$;
  };
};
```

This exchange does nothing else than forward all operations and return all results. Hence, it's
called a `noopExchange`, an exchange that doesn't do anything.

### Forward and Return Composition

When you create a `Client` and pass it an array of exchanges, `urql` composes them left-to-right.
If we look at our previous `noopExchange` example in context, we can track what it does if it sat
in-between the `dedupExchange` and the `fetchExchange`.

```js
import { Client, dedupExchange, fetchExchange } from 'urql';

const noopExchange = ({ client, forward }) => {
  return operation$ => { // <-- The ExchangeIO function
    // We receive a stream of Operations from `dedupExchange` which
    // we can modify before...
    const forwardOperations$ = operations$;

    // ...calling `forward` with the modified stream. The `forward`
    // function is the next exchange's `ExchangeIO` function, in this
    // case `fetchExchange`.
    const operationResult$ = forward(operations$);

    // We get back `fetchExchange`'s stream of results, which we can
    // also change before returning, which is what `dedupExchange`
    // will receive when calling `forward`.
    return operationResult$;
  };
};

const client = new Client({
  exchanges: [dedupExchange, noopExchange, fetchExchange],
});
```

### One operations stream only

When writing an _Exchange_ we have to be careful not to "split" the stream into multiple ones by
subscribing multiple times. Streams are lazy and immutable by default. Every time you use them, you
create a new chain of streaming operators, but since _Exchanges_ are side-effects, we don't want to
accidentally have multiple instances of them in parallel.

Your `ExchangeIO` function receives an `operations$` stream, and you must be careful to either only
use it once, or to _share_ its subscription.

```js
import { pipe, filter, merge, share } from 'wonka';

// DON'T: split use operations$ twice
({ forward }) => operations$ => { // <-- The ExchangeIO function (inline)
  const queries = pipe(
    operations$,
    filter(op => op.operationName === 'query')
  );
  const others = pipe(
    operations$,
    filter(op => op.operationName !== 'query')
  );
  return forward(merge([queries, others]));
};

// DO: share operations$ if you have to use it twice
({ forward }) => operations$ => { // <-- The ExchangeIO function (inline)
  const shared = pipe(
    operations$,
    share
  );
  const queries = pipe(
    shared,
    filter(op => op.operationName === 'query')
  );
  const others = pipe(
    shared,
    filter(op => op.operationName !== 'query')
  );
  return forward(merge([queries, others]));
};

// DO: use operations$ only once alternatively
({ forward }) => operations$ => // <-- The ExchangeIO function (inline)
  pipe(
    operations$,
    map(op => {
      if (op.operationName === 'query') {
        /* ... */
      } else {
        /* ... */
      }
    }),
    forward
  );
```

So if you see the `operations$` stream twice in your exchange code, make sure to
use Wonka's [`share`](https://wonka.kitten.sh/api/operators#share) operator, to share the underlying
subscription between all your streams.

### Don't accidentally drop operations

Typically the `operations$` stream will send you `query`, `mutation`,
`subscription`, and `teardown`. There is no constraint for new operations
to be added later on or a custom exchange adding new operations altogether.

This means that you have to take "unknown" operations into account and
not `filter` operations too aggressively.

```js
import { pipe, filter, merge, share } from 'wonka';

// DON'T: drop unknown operations
({ forward }) => operations$ => {
  // This doesn't handle operations that aren't queries
  const queries = pipe(
    operations$,
    filter(op => op.operationName === 'query')
  );
  return forward(queries);
};

// DO: forward operations that you don't handle
({ forward }) => operations$ => {
  const shared = pipe(
    operations$,
    share
  );
  const queries = pipe(
    shared,
    filter(op => op.operationName === 'query')
  );
  const rest = pipe(
    shared,
    filter(op => op.operationName !== 'query')
  );
  return forward(merge([queries, rest]));
};
```

If you group and or filter operations by what your exchange is handling,
also make sure that you have a stream of operations that it's not handling,
which you should also forward.

### Synchronous first, Asynchronous last

By default exchanges and Wonka streams are as predictable as possible.
Every operator in Wonka runs synchronously until you actually introduce
asynchronicity.

This may happen when you use a timing utility from Wonka, like
[`delay`](https://wonka.kitten.sh/api/operators#delay) or
[`throttle`](https://wonka.kitten.sh/api/operators#throttle)
Or this could happen because your exchange inherently does something asynchronous, like fetching some
data or use a promise.

When you write exchanges, some will inevitably be asynchronous, if
they're fetching results, performing authentication, or other tasks
that you have to wait for.

This can cause problems, because the behavior in `urql` is built
to be _synchronous_ first. This helps us build our suspense mode,
and it helps your components receive cached data on their initial
mount without rerendering.

This why **all exchanges should be ordered synchronous first and
asynchronous last**.

The default order of exchanges is:

```js
import { dedupExchange, cacheExchange, fetchExchange } from 'wonka';

// Also exported as `defaultExchanges`:
[dedupExchange, cacheExchange, fetchExchange];
```

Both the `dedupExchange` and `cacheExchange` are completely
synchronous and only the `fetchExchange` is asynchronous since
it makes a `fetch` request and waits for a server response.

When you're adding more exchanges you obviously have a reason
to put them in a specific order. For instance, an authentication exchange
needs to go before the `fetchExchange`. And a secondary cache would
maybe go in front of the default cache exchange.

But to ensure the correct behavior of suspense mode and
the initialization of our hooks, it's vital to order your exchanges
so that synchronous exchanges come first and asynchronous ones
come last.
