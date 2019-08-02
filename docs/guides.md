# Exchanges

These examples are not the best practices but rather show you
how to get started on creating your own exchange.
Setting up a full-scale authentication exchange for example
would be out of scope here.

> All wonka operators used can be found [here](https://wonka.kitten.sh/api/)

## Authentication

Managing and refreshing tokens is a very common case in
modern application development. In this part we'll build
this exchange from scratch.

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

[Sandbox](https://codesandbox.io/s/recursing-shadow-t8b6g)
