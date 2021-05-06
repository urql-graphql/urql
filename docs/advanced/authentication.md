---
title: Authentication
order: 6
---

# Authentication

Most APIs include some type of authentication, usually in the form of an auth token that is sent with each request header.

The purpose of the [`authExchange`](../api/auth-exchange.md) is to provide a flexible API that facilitates the typical
JWT-based authentication flow.

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

Let's discuss each of the [configuration options](../api/auth-exchange.md#options) and how to use them in turn.

### Configuring `getAuth` (initial load, fetch from storage)

The `getAuth` option is used to fetch the auth state. This is how to configure it for fetching the tokens at initial launch in React:

```js
const getAuth = async ({ authState }) => {
  if (!authState) {
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    if (token && refreshToken) {
      return { token, refreshToken };
    }
    return null;
  }

  return null;
};
```

We check that the `authState` doesn't already exist (this indicates that it is the first time this exchange is executed and not an auth failure) and fetch the auth state from
storage. The structure of this particular `authState` is an object with keys for `token` and
`refreshToken`, but this format is not required. We can use different keys or store any additional
auth related information here. For example, we could decode and store the token expiry date, which
would save us from decoding the JWT every time we want to check whether it has expired.

In React Native, this is very similar, but because persisted storage in React Native is always asynchronous, so is this function:

```js
const getAuth = async ({ authState, mutate }) => {
  if (!authState) {
    const token = await AsyncStorage.getItem(TOKEN_KEY, {});
    const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY, {});
    if (token && refreshToken) {
      return { token, refreshToken };
    }
    return null;
  }

  return null;
};
```

### Configuring `addAuthToOperation`

The purpose of `addAuthToOperation` is to apply an auth state to each request. Note that the format
of the `authState` will be whatever we've returned from `getAuth` and not constrained by the exchange:

```js
import { makeOperation } from '@urql/core';

const addAuthToOperation = ({ authState, operation }) => {
  if (!authState || !authState.token) {
    return operation;
  }

  const fetchOptions =
    typeof operation.context.fetchOptions === 'function'
      ? operation.context.fetchOptions()
      : operation.context.fetchOptions || {};

  return makeOperation(operation.kind, operation, {
    ...operation.context,
    fetchOptions: {
      ...fetchOptions,
      headers: {
        ...fetchOptions.headers,
        Authorization: authState.token,
      },
    },
  });
};
```

First, we check that we have an `authState` and a `token`. Then we apply it to the request
`fetchOptions` as an `Authorization` header. The header format can vary based on the API (e.g. using
`Bearer ${token}` instead of just `token`) which is why it'll be up to us to add the header
in the expected format for our API.

### Configuring `didAuthError`

This function lets the exchange know what is defined to be an API error for your API. `didAuthError` receives an `error` which is of type
[`CombinedError`](../api/core.md#combinederror), and we can use the `graphQLErrors` array in `CombinedError` to determine if an auth error has occurred.

The GraphQL error looks like something like this:

```js
{
  data: null,
  errors: [
    {
      message: 'Unauthorized: Token has expired',
      extensions: {
        code: 'FORBIDDEN'
      },
      response: {
        status: 200
      }
  ]
}
```

Most GraphQL APIs will communicate auth errors via the [error code
extension](https://www.apollographql.com/docs/apollo-server/data/errors/#codes), which
is the recommended approach. We'll be able to determine whether any of the GraphQL errors were due
to an unauthorized error code, which would indicate an auth failure:

```js
const didAuthError = ({ error }) => {
  return error.graphQLErrors.some(e => e.extensions?.code === 'FORBIDDEN');
};
```

For some GraphQL APIs, the auth error is communicated via an 401 HTTP response as is common in RESTful APIs:

```js
{
  data: null,
  errors: [
    {
      message: 'Unauthorized: Token has expired',
      response: {
        status: 401
      }
  ]
}
```

In this case we can determine the auth error based on the status code of the request:

```js
const didAuthError = ({ error }) => {
  return error.graphQLErrors.some(
    e => e.response.status === 401,
  );
},
```

If `didAuthError` returns `true`, it will trigger the exchange to trigger the logic for asking for re-authentication via `getAuth`.

### Configuring `getAuth` (triggered after an auth error has occurred)

If the API doesn't support any sort of token refresh, this is where we could simply log the user out.

```js
const getAuth = async ({ authState }) => {
  if (!authState) {
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    if (token && refreshToken) {
      return { token, refreshToken };
    }
    return null;
  }

  logout();

  return null;
};
```

Here, `logout()` is a placeholder that is called when we got an error, so that we can redirect to a
login page again and clear our tokens from local storage or otherwise.

If we had a way to refresh our token using a refresh token, we can attempt to get a new token for the
user first:

```js
const getAuth = async ({ authState, mutate }) => {
  if (!authState) {
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    if (token && refreshToken) {
      return { token, refreshToken };
    }
    return null;
  }

  const result = await mutate(refreshMutation, {
    token: authState!.refreshToken,
  });

  if (result.data?.refreshLogin) {
    localStorage.setItem('token', result.data.refreshLogin.token);
    localStorage.setItem('refreshToken', result.data.refreshLogin.refreshToken);

    return {
      token: result.data.refreshLogin.token,
      refreshToken: result.data.refreshLogin.refreshToken,
    };
  }

  // This is where auth has gone wrong and we need to clean up and redirect to a login page
  localStorage.clear();
  logout();

  return null;
}
```

Here we use the special mutate function provided by the auth exchange to do the token refresh. If your auth is not handled via GraphQL but a REST endpoint, you can
use `fetch` in this function instead of a mutation. All other requests will be paused while `getAuth` returns, so we never have to handle multiple auth failures
at the same time.

### Configuring `willAuthError`

`willAuthError` is an optional parameter and is run _before_ a network request is made. We can use it to trigger the logic in
`getAuth` without the need to send a request and get a GraphQL Error back. For example, we can use this to predict that the authentication will fail because our JWT is invalid already:

```js
const willAuthError = ({ authState }) => {
  if (!authState || /* JWT is expired */) return true;
  return false;
}
```

This can be really useful when we know when our authentication state is invalid and want to prevent
even sending any operation that we know will fail with an authentication error. However, if we were
to use this and are logging in our users with a login _mutation_ then the above code will
unfortunately never let this login mutation through to our GraphQL API.

If we have such a mutation we may need to write a more sophisticated `willAuthError` function like
the following:

```js
const willAuthError = ({ operation, authState }) => {
  if (!authState) {
    // Detect our login mutation and let this operation through:
    return !(
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
    );
  } else if (false /* JWT is expired */) {
    return true;
  }

  return false;
};
```

Alternatively, you may decide to let all operations through if `authState` isn't defined or to allow
all mutations through. In an application that allows unauthenticated users to perform various
actions, it's a good idea for us to return `false` when `!authState` applies.

[Read more about `@urql/exchange-auth`'s API in our API docs.](../api/auth-exchange.md)

## Handling Logout with the Error Exchange

We can also handle authentication errors in an `errorExchange` instead of the `authExchange`. To do this, we'll need to add the
`errorExchange` to the exchanges array, _before_ the `authExchange`. The order is very important here:

```js
import { createClient, dedupExchange, cacheExchange, fetchExchange, errorExchange } from 'urql';
import { authExchange } from '@urql/exchange-auth';

const client = createClient({
  url: '/graphql',
  exchanges: [
    dedupExchange,
    cacheExchange,
    errorExchange({
      onError: error => {
        const isAuthError = error.graphQLErrors.some(e => e.extensions?.code === 'FORBIDDEN');

        if (isAuthError) {
          logout();
        }
      },
    }),
    authExchange({
      /* config */
    }),
    fetchExchange,
  ],
});
```

The `errorExchange` will only receive an auth error when the auth exchange has already tried and failed to handle it. This means we have
either failed to refresh the token, or there is no token refresh functionality. If we receive an auth error in the `errorExchange` (as defined in
the `didAuthError` configuration section above), then we can be confident that it is an auth error that the `authExchange` isn't able to recover
from, and the user should be logged out.

## Cache Invalidation on Logout

If we're dealing with multiple authentication states at the same time, e.g. logouts, we need to ensure that the `Client` is reinitialized whenever the authentication state changes. Here's an example of how we may do this in React if necessary:

```js
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
    <GraphQLProvider value={client}>
      {/* app content  */}
    <GraphQLProvider>
  }
}
```

When the application launches, the first thing we do is check whether the user has any auth tokens in persisted storage. This will tell us
whether to show the user the logged in or logged out view.

The `isLoggedIn` prop should always be updated based on authentication state change. For instance, we may set it to
`true` after the user has authenticated and their tokens have been added to storage, and set it to
`false` once the user has been logged out and their tokens have been cleared. It's important to clear
or add tokens to a storage _before_ updating the prop in order for the auth exchange to work
correctly.
