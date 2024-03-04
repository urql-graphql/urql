---
title: Authentication
order: 6
---

# Authentication

Most APIs include some type of authentication, usually in the form of an auth token that is sent with each request header.

The purpose of the [`authExchange`](../api/auth-exchange.md) is to provide a flexible API that facilitates the typical
JWT-based authentication flow.

> **Note:** [You can find a code example for `@urql/exchange-auth` in an example in the `urql` repository.](https://github.com/urql-graphql/urql/tree/main/examples/with-refresh-auth)

## Typical Authentication Flow

**Initial login** — the user opens the application and authenticates for the first time. They enter their credentials and receive an auth token.
The token is saved to storage that is persisted though sessions, e.g. `localStorage` on the web or `AsyncStorage` in React Native. The token is
added to each subsequent request in an auth header.

**Resume** — the user opens the application after having authenticated in the past. In this case, we should already have the token in persisted
storage. We fetch the token from storage and add to each request, usually as an auth header.

**Forced log out due to invalid token** — the user's session could become invalid for a variety reasons: their token expired, they requested to be
signed out of all devices, or their session was invalidated remotely. In this case, we would want to
also log them out in the application, so they
could have the opportunity to log in again. To do this, we want to clear any persisted storage, and redirect them to the application home or login page.

**User initiated log out** — when the user chooses to log out of the application, we usually send a logout request to the API, then clear any tokens
from persisted storage, and redirect them to the application home or login page.

**Refresh (optional)** — this is not always implemented; if your API supports it, the
user will receive both an auth token, and a refresh token.
The auth token is usually valid for a shorter duration of time (e.g. 1 week) than the refresh token
(e.g. 6 months), and the latter can be used to request a new
auth token if the auth token has expired. The refresh logic is triggered either when the JWT is known to be invalid (e.g. by decoding it and inspecting the expiry date),
or when an API request returns with an unauthorized response. For graphQL APIs, it is usually an error code, instead of a 401 HTTP response, but both can be supported.
When the token has been successfully refreshed (this can be done as a mutation to the graphQL API or a request to a different API endpoint, depending on implementation),
we will save the new token in persisted storage, and retry the failed request with the new auth header. The user should be logged out and persisted storage cleared if
the refresh fails or if the re-executing the query with the new token fails with an auth error for the second time.

## Installation & Setup

First, install the `@urql/exchange-auth` alongside `urql`:

```sh
yarn add @urql/exchange-auth
# or
npm install --save @urql/exchange-auth
```

You'll then need to add the `authExchange`, that this package exposes to your `Client`. The `authExchange` is an asynchronous exchange, so it must be placed
in front of all `fetchExchange`s but after all other synchronous exchanges, like the `cacheExchange`.

```js
import { Client, cacheExchange, fetchExchange } from 'urql';
import { authExchange } from '@urql/exchange-auth';

const client = new Client({
  url: 'http://localhost:3000/graphql',
  exchanges: [
    cacheExchange,
    authExchange(async utils => {
      return {
        /* config... */
      };
    }),
    fetchExchange,
  ],
});
```

You pass an initialization function to the `authExchange`. This function is called by the exchange
when it first initializes. It'll let you receive an object of utilities and you must return
a (promisified) object of configuration options.

Let's discuss each of the [configuration options](../api/auth-exchange.md#options) and how to use them in turn.

### Configuring the initializer function (initial load)

The initializer function must return a promise of a configuration object and hence also gives you an
opportunity to fetch your authentication state from storage.

```js
async function initializeAuthState() {
  const token = localStorage.getItem('token');
  const refreshToken = localStorage.getItem('refreshToken');
  return { token, refreshToken };
}

authExchange(async utils => {
  let { token, refreshToken } = initializeAuthState();
  return {
    /* config... */
  };
});
```

The first step here is to retrieve our tokens from a kind of storage, which may be asynchronous as
well, as illustrated by `initializeAuthState`.

In React Native, this is very similar, but because persisted storage in React Native is always
asynchronous and promisified, we would await our tokens. This works because the
function that `authExchange` is async, i.e. must return a `Promise`.

```js
async function initializeAuthState() {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  const refreshToken = await AyncStorage.getItem(REFRESH_KEY);
  return { token, refreshToken };
}

authExchange(async utils => {
  let { token, refreshToken } = initializeAuthState();
  return {
    /* config... */
  };
});
```

### Configuring `addAuthToOperation`

The purpose of `addAuthToOperation` is to apply an auth state to each request. Here, we'll use the
tokens we retrieved from storage and add them to our operations.

In this example, we're using a utility we're passed, `appendHeaders`. This utility is a simply
shortcut to quickly add HTTP headers via `fetchOptions` to an `Operation`, however, we may as well
be editing the `Operation` context here using `makeOperation`.

```js
authExchange(async utils => {
  let token = await AsyncStorage.getItem(TOKEN_KEY);
  let refreshToken = await AyncStorage.getItem(REFRESH_KEY);

  return {
    addAuthToOperation(operation) {
      if (!token) return operation;
      return utils.appendHeaders(operation, {
        Authorization: `Bearer ${token}`,
      });
    },
    // ...
  };
});
```

First, we check that we have a non-null `token`. Then we apply it to the request using the
`appendHeaders` utility as an `Authorization` header.

We could also be using `makeOperation` here to update the context in any other way, such as:

```js
import { makeOperation } from '@urql/core';

makeOperation(operation.kind, operation, {
  ...operation.context,
  someAuthThing: token,
});
```

### Configuring `didAuthError`

This function lets the `authExchange` know what is defined to be an API error for your API.
`didAuthError` is called by `authExchange` when it receives an `error` on an `OperationResult`, which
is of type [`CombinedError`](../api/core.md#combinederror).

We can for example check the error's `graphQLErrors` array in `CombinedError` to determine if an auth
error has occurred. While your API may implement this differently, an authentication error on an
execution result may look a little like this if your API uses `extensions.code` on errors:

```js
{
  data: null,
  errors: [
    {
      message: 'Unauthorized: Token has expired',
      extensions: {
        code: 'FORBIDDEN'
      },
    }
  ]
}
```

If you're building a new API, using `extensions` on errors is the recommended approach to add
metadata to your errors. We'll be able to determine whether any of the GraphQL errors were due
to an unauthorized error code, which would indicate an auth failure:

```js
authExchange(async utils => {
  // ...
  return {
    // ...
    didAuthError(error, _operation) {
      return error.graphQLErrors.some(e => e.extensions?.code === 'FORBIDDEN');
    },
  };
});
```

For some GraphQL APIs, the authentication error is only communicated via a 401 HTTP status as is
common in RESTful APIs, which is suboptimal, but which we can still write a check for.

```js
authExchange(async utils => {
  // ...
  return {
    // ...
    didAuthError(error, _operation) {
      return error.response.status === 401;
    },
  };
});
```

If `didAuthError` returns `true`, it will trigger the `authExchange` to trigger the logic for asking
for re-authentication via `refreshAuth`.

### Configuring `refreshAuth` (triggered after an auth error has occurred)

If the API doesn't support any sort of token refresh, this is where we could simply log the user out.

```js
authExchange(async utils => {
  // ...
  return {
    // ...
    async refreshAuth() {
      logout();
    },
  };
});
```

Here, `logout()` is a placeholder that is called when we got an error, so that we can redirect to a
login page again and clear our tokens from local storage or otherwise.

If we had a way to refresh our token using a refresh token, we can attempt to get a new token for the
user first:

```js
authExchange(async utils => {
  let token = localStorage.getItem('token');
  let refreshToken = localStorage.getItem('refreshToken');

  return {
    // ...
    async refreshAuth() {
      const result = await utils.mutate(REFRESH, { refreshToken });

      if (result.data?.refreshLogin) {
        // Update our local variables and write to our storage
        token = result.data.refreshLogin.token;
        refreshToken = result.data.refreshLogin.refreshToken;
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
      } else {
        // This is where auth has gone wrong and we need to clean up and redirect to a login page
        localStorage.clear();
        logout();
      }
    },
  };
});
```

Here we use the special `mutate` utility method provided by the `authExchange` to do the token
refresh. This is a useful method to use if your GraphQL API expects you to make a GraphQL mutation
to update your authentication state. It will send the mutation and bypass all authentication and
prior exchanges.

If your authentication is not handled via GraphQL but a REST endpoint, you can use the `fetch` API
here however instead of a mutation.

All other requests will be paused while `refreshAuth` runs, so we won't have to deal with multiple
authentication errors or refreshes at once.

### Configuring `willAuthError`

`willAuthError` is an optional parameter and is run _before_ a request is made.

We can use it to trigger an authentication error and let the `authExchange` run our `refreshAuth`
function without the need to first let a request fail with an authentication error. For example, we
can use this to predict an authentication error, for instance, because of expired JWT tokens.

```js
authExchange(async utils => {
  // ...
  return {
    // ...
    willAuthError(_operation) {
      // Check whether `token` JWT is expired
      return false;
    },
  };
});
```

This can be really useful when we know when our authentication state is invalid and want to prevent
even sending any operation that we know will fail with an authentication error.

However, we have to be careful on how we define this function, if some queries or login mutations
are sent to our API without being logged in. In these cases, it's better to either detect the
mutations we'd like to allow or return `false` when a token isn't set in storage yet.

If we'd like to detect a mutation that will never fail with an authentication error, we could for
instance write the following logic:

```js
authExchange(async utils => {
  // ...
  return {
    // ...
    willAuthError(operation) {
      if (
        operation.kind === 'mutation' &&
        // Here we find any mutation definition with the "login" field
        operation.query.definitions.some(definition => {
          return (
            definition.kind === 'OperationDefinition' &&
            definition.selectionSet.selections.some(node => {
              // The field name is just an example, since signup may also be an exception
              return node.kind === 'Field' && node.name.value === 'login';
            })
          );
        })
      ) {
        return false;
      } else if (false /* is JWT expired? */) {
        return true;
      } else {
        return false;
      }
    },
  };
});
```

Alternatively, you may decide to let all operations through if your token isn't set in storage, i.e.
if you have no prior authentication state.

## Handling Logout by reacting to Errors

We can also handle authentication errors in a `mapExchange` instead of the `authExchange`.
To do this, we'll need to add the `mapExchange` to the exchanges array, _before_ the `authExchange`.
The order is very important here:

```js
import { createClient, cacheExchange, fetchExchange, errorExchange } from 'urql';
import { authExchange } from '@urql/exchange-auth';

const client = createClient({
  url: 'http://localhost:3000/graphql',
  exchanges: [
    cacheExchange,
    mapExchange({
      onError(error, _operation) {
        const isAuthError = error.graphQLErrors.some(e => e.extensions?.code === 'FORBIDDEN');
        if (isAuthError) {
          logout();
        }
      },
    }),
    authExchange(async utils => {
      return {
        /* config */
      };
    }),
    fetchExchange,
  ],
});
```

The `mapExchange` will only receive an auth error when the auth exchange has already tried and failed
to handle it. This means we have either failed to refresh the token, or there is no token refresh
functionality. If we receive an auth error in the `mapExchange`'s `onError` function
(as defined in the `didAuthError` configuration section above), then we can be confident that it is
an authentication error that the `authExchange` isn't able to recover from, and the user should be
logged out.

## Cache Invalidation on Logout

If we're dealing with multiple authentication states at the same time, e.g. logouts, we need to
ensure that the `Client` is reinitialized whenever the authentication state changes.
Here's an example of how we may do this in React if necessary:

```jsx
import { createClient, Provider } from 'urql';

const App = ({ isLoggedIn }: { isLoggedIn: boolean | null }) => {
  const client = useMemo(() => {
    if (isLoggedIn === null) {
      return null;
    }

    return createClient({ /* config */ });
  }, [isLoggedIn]);

  if (!client) {
    return null;
  }

  return {
    <Provider value={client}>
      {/* app content  */}
    <Provider>
  }
}
```

When the application launches, the first thing we do is check whether the user has any authentication
tokens in persisted storage. This will tell us whether to show the user the logged in or logged out view.

The `isLoggedIn` prop should always be updated based on authentication state change. For instance, we may set it to
`true` after the user has authenticated and their tokens have been added to storage, and set it to
`false` once the user has been logged out and their tokens have been cleared. It's important to clear
or add tokens to a storage _before_ updating the prop in order for the auth exchange to work
correctly.

This pattern of creating a new `Client` when changing authentication states is especially useful
since it will also recreate our client-side cache and invalidate all cached data.
