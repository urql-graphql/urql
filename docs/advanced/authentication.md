---
title: Authentication
order: 8
---

Most APIs include some type of authentication, usually in the form of an auth token that is sent with each request header.

The purpose of the [`authExchange`](../api/auth-exchange) is to provide a flexible API that facilitates the typical
JWT-based authentication flow.

## Typical Authentication Flow

1. Initial login
    The user opens the application and authenticates for the first time. They enter their credentials and receive an auth token.
    The token is saved to storage that is persisted though sessions, e.g. `localStorage` on the web or `AsyncStorage` in React Native.
    The token is added to each subsequent request in an auth header.

2. Resume
    The user opens the application after having authenticated in the past. In this case, we should already have the token in persisted storage.
    We fetch the token from storage and add to each request, usually as an auth header.

3. Forced log out due to invalid token
    The user's session could become invalid for a variety reasons:
    - their token expired
    - they requested to be signed out of all devices
    - their session was invalidated remotely

    In this case, we would want to also log them out in the application so they could have the opportunity to log in again. To do this,
    we want to clear any persisted storage, and redirect them to the application home or login page.

4. User initiated log out
    When the user chooses to log out of the application, we usually send a logout request to the API, then clear any tokens from persisted
    storage, and redirect them to the application home or login page.

5. Refresh (optional)
    This is not always implemented, but given that your API supports it, the user will receive both an auth token and a refresh token, where the auth token
    is valid for a shorter duration of time (e.g. 1 week) than the refresh token (e.g. 6 months) and the latter can be used to request a new
    auth token if the auth token has expired.

    The refresh logic is triggered either when the JWT is known to be invalid (e.g. by decoding it and inspecting the expiry date), or when an API
    request returns with an unauthorized response. For graphQL APIs, it is usually an error code, instead of a 401 HTTP response, but both can be
    supported. When the token as been successfully refreshed (this can be done as a mutation to the graphQL API or a request to a different API
    endpoint, depending on implementation), we will save the new token in persisted storage, and retry the failed request with the new auth header.
    The user should be logged out and persisted storage cleared if the refresh fails or if the re-executing the query with the new token fails with
    an auth error for the second time.

## Implementation

First, install the `@urql/exchange-auth` alongside `urql`:

```sh
yarn add @urql/exchange-auth
# or
npm install --save @urql/exchange-auth
```

You'll then need to add the `authExchange`, that this package exposes to your Client. The `authExchange` is an asynchronous exchange, so it must be placed
in front of all `fetchExchanges` but after all other synchronous exchanges, like the `cacheExchange`.

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

Important! You'll need to ensure that a new instance of the urql client is recreated whenever the user's authentication state changes. Here's an example of
how to do this with a `useMemo`:

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

When the application launches, the first thing we should do is check whether the user has any auth tokens in persisted storage. This will tell us
whether to show the user the logged in or logged out view, and the `isLoggedIn` prop should be set accordingly:

- `null` - auth state is still being verified
- `true` - the user is authenticated
- `false` - the user is not authenticated

The `isLoggedIn` prop should always be updated based on authentication state change e.g. set to `true` after the use has authenticated and their tokens have been
added to storage, and set to `false` if the user has been logged out and their tokens have been cleared. It's important clear or add tokens to storage _before_
updating the prop in order for the auth exchange to work.

Next, we are going to discuss each of the [configuration options](../api/auth-exchange/#options) and how to use them.

### Configuring `getAuth` (fetch from storage)

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
}
```

We check that the `authState` doesn't already exist (this indicates that it is the first time this exchange is executed and not an auth failure) and fetch the auth state from
storage. The structure of this particular`authState` is an object with keys for `token` and `refreshToken`, but this format is not required. You can
use different keys or store any additional auth related information here. For example you could decode and store the token expiry date, which would save you from decoding
your JWT every time you want to check whether your token is expired.

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
}
```

### Configuring `addAuthToOperation`

The purpose of `addAuthToOperation` is to take apply your auth state to each request. Note that the format of the `authState` will be whatever
you've returned from `getAuth` and not at all constrained by the exchange:

```js
const addAuthToOperation = ({
  authState,
  operation,
}) => {
  if (!authState || !authState.token) {
    return operation;
  }

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

First we check that we have an `authState` and a `token`. Then we apply it to the request `fetchOptions` as an `Authorization` header.
The header format can vary based on the API (e.g using `Bearer ${token}` instead of just `token`) which is why it'll be up to you to add the header
in the expected format for your API.

### Configuring `didAuthError`

This function lets the exchange know what is defined to be an API error for your API:

```js
const didAuthError = ({ error }) => {
  return error.graphQLErrors.some(
    e => e.extensions?.code === 'FORBIDDEN',
  );
}
```

For most graphQL APIs, the auth error is communicated as an error code, however it may also be a 401 HTTP response:

```js
const didAuthError = ({ error }) => {
  return error.graphQLErrors.some(
    e => error.response.status === 401,
  );
},
```

Then `didAuthError` returns `true`, it will trigger the exchange to trigger the logic for asking for reauthentication via `getAuth`.

### Configuring `getAuth` (after `didAuthError` returns `true`)

If your API doesn't support any sort of token refresh, this is where you should simply log the user out.

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
}
```

Here, `logout()` should clear your persisted storage of any tokens and set the `isLoggedIn` property as described above to `false`.

If you do have a token refresh endpoint, and a refresh token, you can attempt to get a new token for the user:

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

  localStorage.clear();
  logout();

  return null;
}
```

Here we use the special mutate function provided by the auth exchange to do the token refresh. If your auth is not handled via graphQL, you can
use `fetch` in this function instead of a mutation. All other requests will be paused while `getAuth` returns, so you won't get multiple auth failures
at the same time.

### Configuring `willAuthError`

`willAuthError` is an optional parameter and is run _before_ a network request is made. You can use it to trigger the logic in
`getAuth` without the need to get a graphql error first. For example, you could use this indicate that the auth will fail because the JWT is invalid:

```js
const willAuthError = ({ authState }) => {
  if (!authState || /* JWT is expired */) return true;
  return false;
}
```

## Handling Logout with the Error Exchange

It is also possible to handle your logout logic in the error exchange instead of in the auth exchange. To do this, you'll need to add the
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
      onError: ({ error }) => {
        const isAuthError = error.graphQLErrors.some(
          e => e.extensions?.code === 'FORBIDDEN',
        );

        if (isAuthError) {
          logout();
        }
      }
    }),
    authExchange({
      /* config */
    }),
    fetchExchange,
  ],
});
```

The `errorExchange` will only receive an auth error when the auth exchange as tried and failed to handle it. This means we have
either failed to refresh the token, or there is no token refresh functionality. If you get an auth error in the `errorExchange` (as defined in
the `didAuthError` configuration section above), then you can be confident that it is an auth error, the `authExchange` isn't able to recover
from it, and the user should be logged out.
