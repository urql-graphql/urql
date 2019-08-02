# Guides

In `urql`, all queries and requests start as "operations". A stream
of operations is piped through "exchanges" which handle any logic
around resolving the operations, eventually sending a result back
in a stream of "operation results".

They're not unlike middleware in an HTTP server implementation like
Express. They have the ability to forward operations to the next
exchange and to return the stream of results from the next exchange.

[You can read more about this structure in our "Architecture" section](./architecture.md)

These guides are not intended as best practices or specific instructions for
writing exchanges. Rather they teach you how to get started on creating
your own exchanges by learning how we write ours.

## The Rules of Exchanges

Before we jump into writing some exchanges, there are a couple of
patterns and limitations that always remain the same when writing
an exchange.

For reference, this is a basic template for an exchange:

```js
const noopExchange = ({ client, forward }) => {
  return operations$ => {
    return forward(operations$);
  };
};
```

In this form it doesn't do anything yet.
When you create a client and pass it an array of exchanges, all exchanges
will be composed together into a single one. They will each be called with
an object that contains the `client` itself, and a `forward` function which
is the next `ExchangeIO` function.

The `ExchangeIO` function is what each exchange returns. This is a function
that receives the stream of operations and must return a stream of results.

So our `noopExchange` is the minimal template that fulfils this requirement.
It just receives the operations stream and passes it on to `forward`.

### One operations stream only

When writing an exchange we have to be careful not to "split" the stream
into multiple ones by subscribing multiple times.

Streams are lazy and immutable by default. Every time you use them,
you create a new chain of streaming operators.

Your `ExchangeIO` function receives an `operations$` stream, and you
must be careful to either only use it once, or to _share_ its subscription.

```js
import { pipe, filter, merge, share } from 'wonka';

// DON'T: split use operations$ twice
({ forward }) => operations$ => {
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
({ forward }) => operations$ =>
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
use Wonka's [`share`](https://wonka.kitten.sh/api/operators#share) operator, to share the underlying subscription between
all your streams.

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
[`delay`](https://wonka.kitten.sh/api/operators#delay) or [`throttle`](https://wonka.kitten.sh/api/operators#throttle). Or this could happen because
your exchange inherently does something asynchronous, like fetch
some data or use a promise.

When you write exchanges, some will inevitably be asynchronous, if
they're fetching results, performing authentication, or other tasks
that you have to wait for.

This can cause problems, because the behaviour in `urql` is built
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

But to ensure the correct behaviour of suspense mode and
the initialization of our hooks, it's vital to order your exchanges
so that synchronous exchanges come first and asynchronous ones
come last.

> All wonka operators used can be found [here](https://wonka.kitten.sh/api/)

## Authentication

Managing and refreshing tokens is a very common case in
modern application development. In this part we'll build
this exchange from scratch.

> _Note:_ Setting up a full-scale authentication exchange would be
> out of scope here. Instead this section teaches the basics on
> how to wait for an asynchronous request to complete when
> necessary before letting operations through.

So let's start with the basic template for an exchange

```js
import { pipe } from 'wonka';

export const refreshTokenExchange = ({ forward }) => {
  return operations$ => {
    return pipe(
      operations$,
      forward
    );
  };
};
```

As of now it enters the exchange and tells it to continue due
to forward being invoked. So this is basically an empty
exchange.

Next up is writing some code that refreshes our token, so imagine
the following method:

> note that these methods should be replaced with your own logic.

```js
const refreshToken = () => {
  return Promise.resolve(
    fetch('/refreshToken', {
      headers: {
        'application-type': 'application/json',
        refreshToken: window.localStorage.get('refreshToken'),
      },
    })
      .then(res => res.json())
      .then(res => {
        window.localStorage.setItem('token', res.data.token);
        return res.data.token;
      })
      .catch(console.error)
  );
};
```

so now that we have the methods to refresh our token
we can transform the previous exchange to handle the
returned promise.

```js
import { pipe, fromPromise, map } from 'wonka';

export const refreshTokenExchange = ({ forward }) => {
  return operations$ => {
    return pipe(
      operations$,
      pipe(
        fromPromise(refreshToken()),
        map(newToken => ({ ...op, context: { ...op.context, token: newToken } }))
      );
      forward,
    )
  }
}
```

With this change our refreshToken will be invoked every time this pipeline
gets called. Since we have a nested pipe that takes a promise and enriches
our operation with the new token. The `map` will trigger when `fromPromise`
completes.

> Here we see that we can alter our operation that finally gets
> passed to the `fetchExchange`

This can be made better by not triggering the refreshToken mechanism when
the token is still valid, we don't want to block our exchange pipeline
on every request. It's blocked since we are waiting from an async action
in `fromPromise`.

```js
import { pipe, fromPromise, map, mergeMap } from 'wonka';

const readToken = () => window.localStorage.getItem('token');
const isTokenExpired = () => {
  const token = readToken();
  if (!token) return true;
  const { expired } = JSON.parse(window.atob(token));
  return !!expired;
}

export const refreshTokenExchange = ({ forward }) => {
  return operations$ => {
    return pipe(
      operations$,
      mergeMap(op => {
        if (isTokenExpired()) {
          return pipe(
            fromPromise(refreshToken()),
            map(newToken => ({ ...op, context: { ...op.context, token: newToken } }))
          );
        } else {
          return fromValue({ ...op, context: { ...op.context, token: readToken() } })
        }
      })
      forward,
    )
  }
}
```

We use mergeMap to see if our token is expired and return our previously
made `pipe` that refreshes our token or use the still valid token.

Now we face one last problem, what if we dispatch multiple queries
while our token is invalid?
Let's transform our exchange into a higher order function to solve this
issue.

```js
import { pipe, fromPromise, map, mergeMap, fromValue } from 'wonka';

export const refreshTokenExchange = () => {
  let promise;
  return ({ forward }) => {
    return operations$ => {
      return pipe(
        operations$,
        mergeMap(op => {
          if (isTokenExpired()) {
            return pipe(
              fromPromise(promise ? promise : promise = refreshToken()),
              map(newToken => {
                promise = undefined;
                return { ...op, context: { ...op.context, token: newToken } }
              })
            );
          } else {
            return fromValue({ ...op, context: { ...op.context, token: readToken() } })
          }
        })
        forward,
        // Inserting an operator here will make it run after the operation
        // has completed.
      )
    }
  }
}
```

All that's left to do is use your own brand new exchange
by adding it into your exchanges array as `refreshTokenExchange()`.

[Check out the full, working example in a CodeSandbox](https://codesandbox.io/s/recursing-shadow-t8b6g)
