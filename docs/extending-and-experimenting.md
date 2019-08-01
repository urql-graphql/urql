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
import { Context, createRequest } from 'urql';

export const useQuery = ({ query, variables }) => {
  const client = useContext(Context);
  const request = createRequest(query, variables);
  const source = client.executeQuery(request);
};
```

The `createRequest` helpers is used to create a `GraphQLRequest` object.
It's very simple and apart from putting the `query` and `variables` onto
an object, it also hashes them and adds a `key` property. We then pass this
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
    setResult(prev => ({ ...prev, fetching: true }));

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

## Creating your first exchange

### Authentication

Managing and refreshing tokens is a very common case in
modern application development. In this part we'll build
this exchange from scratch.

> All wonka operators used can be found [here](https://wonka.kitten.sh/api/)

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
our operation with the new token.

> Here we see that we can alter our operation that finally gets
> passed to the `fetchExchange`

This can be made better by not triggering the refreshToken mechanism when
the token is still valid.

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
              // note that promise is being set in refreshToken now.
              fromPromise(promise ? promise : refreshToken(promise)),
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
      )
    }
  }
}
```

All that's left to do is use your own brand new exchange
by adding it into your exchanges array as `refreshTokenExchange()`.

## FAQ

My component/hooks keeps triggering rerenders when passing in `context`

- When not memoizing `context` this will always trigger refetches,
  this can be done through the `useMemo` hook.
