---
title: '@urql/exchange-auth'
order: 9
---

# Authentication Exchange

The `@urql/exchange-auth` package contains an addon `authExchange` for `urql` that aims to make it
easy to implement complex authentication and reauthentication flows as are typically found with JWT
token based API authentication.

## Installation and Setup

First install `@urql/exchange-auth` alongside `urql`:

```sh
yarn add @urql/exchange-auth
# or
npm install --save @urql/exchange-auth
```

You'll then need to add the `authExchange`, that this package exposes to your `Client`. The
`authExchange` is an asynchronous exchange, so it must be placed in front of all `fetchExchange`s
but after all other synchronous exchanges, like the `cacheExchange`.

```js
import { createClient, dedupExchange, cacheExchange, fetchExchange } from 'urql';
import { authExchange } from '@urql/exchange-auth';

const client = createClient({
  url: '/graphql',
  exchanges: [
    dedupExchange,
    cacheExchange,
    authExchange({
      /* config */
    }),
    fetchExchange,
  ],
});
```

The `authExchange` accepts an object of options, which are used to configure how your
authentication method works. Internally, the `authExchange` keeps an authentication state, whose
shape is determined by the functions passed to the exchange's options:

- `addAuthToOperation` must be provided to tell `authExchange` how to add authentication information
  to an operation, e.g. how to add the authentication state to an operation's fetch headers.
- `getAuth` must be provided to let the `authExchange` handle the authentication flow, including
  token refreshes and other reauthentication. It may send mutations to the GraphQL API or make
  out-of-band API requests using `fetch`.
- `didAuthError` may be provided to let the `authExchange` detect authentication errors from the API
  to trigger the `getAuth` method and reauthentication flow.
- `willAuthError` may be provided to detect expired tokens or tell whether an operation will likely
  fail due to an authentication error, which may trigger the `getAuth` method and reauthentication
  flow early.

## Options

| Option               | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `addAuthToOperation` | Receives a parameter object with the current `authState` (`null \| T`) and an error ([See `CombinedError`](./core.md#combinederror)). It should return the same operation to which the authentication state has been added, e.g. as an authentication header.                                                                                                                                                                                                                          |
| `getAuth`            | This provided method receives the `authState` (`null \| T`). It should then refresh the authentication state using either a `fetch`call or [the`mutate`method, which is similar to`client.mutation`](./core.md#clientmutation) and return a new `authState`object. In case it receives`null` it should return a stored authentication state, e.g. from local storage. It's allowed to throw an error, which will interrupt the auth flow and let the authentication error fallthrough. |
| `didAuthError`       | May be provided and return a `boolean` that indicates whether an error is an authentication error, given `error: CombinedError` and `authState: T \| null` as parameters.                                                                                                                                                                                                                                                                                                              |
| `willAuthError`      | May be provided and return a `boolean` that indicates whether an operation is likely to fail, e.g. due to an expired token, to trigger the authentication flow early, and is given `operation: Operation` and `authState: T \| null` as parameters.                                                                                                                                                                                                                                    |

## Examples

The `addAuthToOperation` method is frequently populated with a function that adds the `authState` to
the operation's fetch headers.

```js
function addAuthToOperation: ({
  authState,
  operation,
}) {
  // the token isn't in the auth state, return the operation without changes
  if (!authState || !authState.token) {
    return operation;
  }

  // fetchOptions can be a function (See Client API) but you can simplify this based on usage
  const fetchOptions =
    typeof operation.context.fetchOptions === 'function'
      ? operation.context.fetchOptions()
      : operation.context.fetchOptions || {};

  return {
    ...operation,
    context: {
      ...operation.context,
      fetchOptions: {
        ...fetchOptions,
        headers: {
          ...fetchOptions.headers,
          "Authorization": authState.token,
        },
      },
    },
  };
}
```

[Read more examples in the documentation given here.](https://github.com/FormidableLabs/urql/tree/main/exchanges/auth#quick-start-guide)
