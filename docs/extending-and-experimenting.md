# Extending & Experimenting

Hopefully you have read the sections on `urql`'s [Architecture](architecture.md)
and its [Basics](basics.md). This section will introduce you to hacking
with `urql`.

`urql` comes with some very functional defaults, but its standard component APIs,
hook APIs, or its core behaviour might not be enough for your complex app. Or
maybe you're just looking to play around and experiment with GraphQL clients?

This document contains two main sections. The first is about reusing `urql`'s
core and build new "outward facing APIs". The second is about writing new
exchanges and hence changing `urql`'s core behaviour.

## Writing new APIs for the Client

Usage of `urql`'s Client is not limited to the included React component
and hooks or even React at all.

The Client is structured so that it can easily be reused to create different
APIs or integrate `urql` with other libraries and frameworks than React.
[Have a look at the API docs to see a full list of the client's methods.](api.md#client-class)

While it's possible to write new APIs outside of React or new components
quite easily, this section will only focus on hooks, for illustrative
purposes.

### Writing `useQuery` from scratch

There's a couple of outward facing APIs that `urql` comes with, but none
illustrate how to write new APIs better than
[the `useQuery` hook](https://github.com/FormidableLabs/urql/blob/master/src/hooks/useQuery.ts).

To write a basic `useQuery` hook, we'll start by pulling in the client via
the context API. Every GraphQL request must pass through the client to make
use of `urql`'s `Operation` management and exchange pipeline.

```js
import { useContext } from 'react';
import { Context } from 'urql';

export const useQuery = () => {
  const client = useContext(Context);
};
```

At this point we have the client. Next we'll want to accept a request
and execute a query.

```js
import { useContext } from 'react';
import { Context, createQuery } from 'urql';

export const useQuery = ({ query, variables }) => {
  const client = useContext(Context);
  const request = createQuery(query, variables);
  const source = client.executeQuery(request);
};
```

The `createQuery` helpers is used to create a `GraphQLRequest` object.
It's very simple and simply a convenience helper. We then pass this
request to `client.executeQuery` and receive a `Source`.

The `Source` is a type from [Wonka](https://github.com/kitten/wonka) and
can basically be understood to be an Observable that doesn't follow the
[Observable spec](https://github.com/tc39/proposal-observable) but
instead the [Callbag spec (loosely).](https://github.com/callbag/callbag)

It comes with some helpers that users of `RxJS` might already be
familiar with. We don't need a lot of these functions though
to just subscribe to `source` and get the data out. In fact,
we'll only need `subscribe`.

```js
import { useContext } from 'react';
import { pipe, subscribe } from 'wonka';
import { Context, createQuery } from 'urql';

export const useQuery = ({ query, variables }) => {
  const client = useContext(Context);
  const request = createQuery(query, variables);

  pipe(
    client.executeQuery(request),
    subscribe(({ data, error }) => {
      console.log(data, error);
    })
  );
};
```

We are now able to receive the GraphQL results. Next we'll want to
use `useState` to store the results in some state and we'll want
to wrap the query in `useEffect` so we can trigger it when
the hook's inputs change.

```js
import { useContext, useState, useEffect } from 'react';
import { pipe, subscribe } from 'wonka';
import { Context, createQuery } from 'urql';

export const useQuery = ({ query, variables }) => {
  const [result, setResult] = useState({
    fetching: false,
    error: undefined,
    data: undefined,
  });

  const client = useContext(Context);

  useEffect(() => {
    setState(prev => ({ ...prev, fetching: true }));

    const request = createQuery(query, variables);

    const [teardown] = pipe(
      client.executeQuery(request),
      subscribe(({ data, error }) => {
        setResult({ fetching: false, data, error });
      })
    );

    return teardown;
  }, [query, variables]);

  return result;
};
```

We have now:

- Added some default state with `fetching: false`
- Wrapped the query in `useEffect`
- Added the `teardown` function that unsubscribes from the source and return it
  in `useEffect`
- Added the second `useEffect` argument to tell it when to rerun
- Added state to set `fetching: true` and to update the result

In the actual implementation of the hook we also generalise this
execution and expose the `executeQuery` function in the returned tuple.
This is left out here as the implementation can be found in the source code.

This relatively simple pattern can be used to implement
new APIs. All we need to do is create a `GraphQLRequest`,
subscribe to the result of `executeQuery`, keep track
of the unsubscription (`teardown`) and update
some state. This all can be reapplied when you write your
own APIs.

## Making your own Exchange

As with any library, you're going to find yourself wanting to change (or adapt) the way things work.
Since day one, with `urql`, we have aimed to make adaptability our number one priority through the use of _Exchanges_.
Lets run through how this works by creating our own Dedup exchange - a middleware to debounce incoming query operations.

> Note: We've already provided a bunch of exchanges that we thought you would find
> useful. Check out the [exchanges source code](https://github.com/FormidableLabs/urql/blob/master/src/exchanges) for examples and usage information.

Before you begin, it is assumed that you understand the fundamentals of _Operations_
and _Exchanges_ in `urql`. There's a detailed description in the [Architecture](./architecture.md) section of the docs, but here's a quick recap:

- Every operation in `urql` is passed to exchanges
- Each exchange can do one of two things
  - Forward the operation to the next exchange in line
  - Return a result of the operation to the client

First thing first, lets set up our boilerplate by making an _Exchange_ that takes an operation stream and passes it immediately to the next exchange in line. We'll also add in some initial logic which will later allow us to track which operations are in progress.

```ts
import { filter, pipe, tap } from 'wonka';
import { Exchange } from 'urql';

export const dedupExchange: Exchange = ({ forward }) => {
  const inFlight = new Set<string>();

  return ops$ => forward(ops$);
};
```

You can see from the above example that an exchange is a [curried function](https://medium.com/javascript-scene/curry-and-function-composition-2c208d774983). It takes some setup arguments and returns a function which receives an operation stream (`ops$`) and forwards it to the next exchange (`forward`).

Next thing we want to do is track unique incoming operations and add them to our tracking set. We also want to delete them from our set once the operation has completed. In order to do this we will be using the `pipe` and `tap` functions provided by `wonka`.

> Note: The easiest way to uniquely identify an operation is by checking it's `key` property. This is a uniquely generated hash intended for this purpose.

```ts
import { filter, pipe, tap } from 'wonka';
import { Exchange } from 'urql';

export const dedupExchange: Exchange = ({ forward }) => {
  const inFlight = new Set<string>();

  return ops$ => {
    const preFlight$ = pipe(
      ops$,
      // "tap" is called every time a new operation comes through.
      // "tap" is invisible to subsequent stream operations
      tap(operation => {
        if (operation.operationName !== 'query') {
          return;
        }

        inFlight.add(operation.key);
      })
    );

    return pipe(
      forward(preFlight$),
      // This `tap` is called after an operation has been completed
      tap(response => inFlight.delete(response.operation.key))
    );
  };
};
```

Our exchange now tracks operations and their completion, but in order for this to be useful,
we need to stop in flight operations being forwarded to the next exchange. In order to do this,
we're now going to have to use the `filter` function. To simplify things further, we can group all our pre-flight logic together.

```ts
import { filter, pipe, tap } from 'wonka';
import { Exchange } from 'urql';

export const dedupExchange: Exchange = ({ forward }) => {
  const inFlight = new Set<string>();

  return ops$ => {
    const preFlight$ = pipe(
      ops$,
      filter(operation => {
        // Don't filter non-query operations
        if (operation.operationName !== 'query') {
          return true;
        }

        const isInFlight = inFlight.has(operation.key);
        inFlight.add(operation.key);

        return isInFlight;
      })
    );

    return pipe(
      forward(preFlight$),
      // This `tap` is called after an operation has been completed
      tap(response => inFlight.delete(response.operation.key))
    );
  };
};
```

Hopefully you've been following this example along, if that's the case, congratulations! You just created your first exchange. The only thing left is to add it to `urql` on client creation.

> Note: Remember, operations are forwarded in a linear fashion. Depending on your exchange, ordering may be important (in this example, dedup needs to come before fetch otherwise it wouldn't do anything).

```ts
import {
  createClient,
  cacheExchange,
  debugExchange,
  fetchExchange,
} from 'urql';
import { dedupExchange } from './myDedupExchange';

export const urqlClient = createClient({
  url: 'https://localhost:3000/graphql',
  exchanges: [dedupExchange, debugExchange, cacheExchange, fetchExchange],
});
```

To conclude, here's a quick recap of what we've achieved:

- We created our own _Exchange_!
- When duplicate operations come through which are already in flight we block them.
- Both client side components will be updated when the single operation is completed (this is due to how the `urql` client subscribes to operations).
