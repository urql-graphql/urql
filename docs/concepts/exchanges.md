---
title: Exchanges
order: 3
---

# Exchanges

As we've learned on the [Stream Patterns](./stream-patterns.md) page, `urql`'s `Client` structures
its data as an event hub. We have an input stream of operations, which are instructions for the
`Client` to provide a result. These results then come from an output stream of operation results.

_Exchanges_ are responsible for performing the important transform from the operations (input) stream to the results stream. Exchanges are handler functions that deal with these input and
output streams. They're one of `urql`'s key components, and are needed to implement vital pieces of logic such as
caching, fetching, deduplicating requests, and more. In other words, Exchanges are handlers that
fulfill our GraphQL requests and can change the stream of operations or results.

The default set of exchanges that `@urql/core` contains and applies to a `Client` are:

- `dedupExchange`: Deduplicates pending operations (pending = waiting for a result)
- `cacheExchange`: The default caching logic with ["Document Caching"](../basics/document-caching.md)
- `fetchExchange`: Sends an operation to the API using `fetch` and adds results to the output stream

Other available exchanges:

- [`errorExchange`](../api/core.md#errorexchange): Allows a global callback to be called when any error occursz
- [`ssrExchange`](../advanced/server-side-rendering.md): Allows for a server-side renderer to
  collect results for client-side rehydration.
- [`retryExchange`](../api/retry-exchange.md): Allows operations to be retried
- [`multipartFetchExchange`](../api/multipart-fetch-exchange.md): Provides multipart file upload capability
- [`persistedFetchExchange`](../api/persisted-fetch-exchange.md): Provides support for Automatic
  Persisted Queries
- [`authExchange`](../api/auth-exchange.md): Allows complex authentication flows to be implemented
  easily.
- [`requestPolicyExchange`](../api/request-policy-exchange.md): Automatically upgrades `cache-only` and `cache-first` operations to `cache-and-network` after a given amount of time.
- `devtoolsExchange`: Provides the ability to use the [urql-devtools](https://github.com/FormidableLabs/urql-devtools)

It is also possible to apply custom exchanges to override the default logic.

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

- [Read more about streams on the "Stream Patterns" page.](../concepts/stream-patterns.md)
- [Read more about the _Exchange_ type signature on the API docs.](../api/core.md#exchange)

## Using Exchanges

The `Client` accepts an `exchanges` option that defaults to the three default exchanges mentioned above. When we pass a custom list of exchanges the `Client` uses the `composeExchanges`
utility, which starts chaining these exchanges.

In essence these exchanges build a pipeline that runs in the order they're passed; _Operations_ flow
in from the start to the end, and _Results_ are returned through the chain in reverse.

If we look at our list of default exchanges — `dedupExchange`, `cacheExchange`, and then
`fetchExchange` — an incoming operation is treated as follows:

**First,** ongoing operations are deduplicated. It wouldn't make sense to send the
same operation / request twice in parallel.

**Second,** operations are checked against the cache. Depending on the `requestPolicy`,
cached results can be resolved from here instead, which would mean that the cache sends back the
result and the operation doesn't travel any further in the chain.

**Third,** operations are sent to the API and the result is turned into an `OperationResult`.

**Lastly,** operation results then travel through the exchanges in _reverse order_, which is because
exchanges are a pipeline where all operations travel forward deeper into the exchange chain, and
then backwards. When these results pass through the cache then the `cacheExchange` stores the
result.

```js
import { createClient, dedupExchange, fetchExchange, cacheExchange } from 'urql';

const client = createClient({
  url: '/graphql',
  exchanges: [dedupExchange, cacheExchange, fetchExchange],
});
```

We can add more exchanges to this chain, for instance, we can add the `errorExchange`, which calls a
global callback whenever it sees [a `CombinedError`](../basics/errors.md) on an `OperationResult`.

```js
import { createClient, dedupExchange, fetchExchange, cacheExchange, errorExchange } from 'urql';

const client = createClient({
  url: '/graphql',
  exchanges: [
    dedupExchange,
    cacheExchange,
    errorExchange({
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
called a `noopExchange` - an exchange that doesn't do anything.

### Forward and Return Composition

When you create a `Client` and pass it an array of exchanges, `urql` composes them left-to-right.
If we look at our previous `noopExchange` example in context, we can track what it does if it is located between the `dedupExchange` and the `fetchExchange`.

```js
import { Client, dedupExchange, fetchExchange } from 'urql';

const noopExchange = ({ client, forward }) => {
  return operations$ => {
    // <-- The ExchangeIO function
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

### Only One Operations Stream

When writing an Exchange we have to be careful not to _split_ the stream into multiple ones by
subscribing multiple times. Streams are lazy and immutable by default. Every time you use them, a new chain of streaming operators is created; since Exchanges are technically side-effects, we don't want to
accidentally have multiple instances of them in parallel.

The `ExchangeIO` function receives an `operations$` stream. It's important to be careful to either only
use it once, or to _share_ its subscription.

```js
import { pipe, filter, merge, share } from 'wonka';

// DON'T: split use operations$ twice
({ forward }) => operations$ => {
  // <-- The ExchangeIO function (inline)
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
({ forward }) => operations$ => {
  // <-- The ExchangeIO function (inline)
  const shared = pipe(operations$, share);
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
({ forward }) => (
  operations$ // <-- The ExchangeIO function (inline)
) =>
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

### How to Avoid Accidentally Dropping Operations

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
  const shared = pipe(operations$, share);
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

The default order of exchanges is:

```js
import { dedupExchange, cacheExchange, fetchExchange } from 'urql';

// Also exported as `defaultExchanges`:
[dedupExchange, cacheExchange, fetchExchange];
```

Both the `dedupExchange` and `cacheExchange` are completely
synchronous. The `fetchExchange` is asynchronous since
it makes a `fetch` request and waits for a server response.

When you're adding more exchanges it's often crucial
to put them in a specific order. For instance - an authentication exchange
will need to go before the `fetchExchange`, a secondary cache will probably have to
go in front of the default cache exchange.

To ensure the correct behavior of suspense mode and
the initialization of our hooks, it's vital to order exchanges
so that synchronous ones come before asynchronous ones.
