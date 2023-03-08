---
'@urql/exchange-auth': major
---

Implement new `authExchange` API, which removes the need for an `authState` (i.e. an internal authentication state) and removes `getAuth`, replacing it with a separate `refreshAuth` flow.

The new API requires you to now pass an initializer function. This function receives a `utils`
object with `utils.mutate` and `utils.appendHeaders` utility methods.
It must return the configuration object, wrapped in a promise, and this configuration is similar to
what we had before, if you're migrating to this. Its `refreshAuth` method is now only called after
authentication errors occur and not on initialization. Instead, it's now recommended that you write
your initialization logic in-line.

```js
authExchange(async utils => {
  let token = localStorage.getItem('token');
  let refreshToken = localStorage.getItem('refreshToken');
  return {
    addAuthToOperation(operation) {
      return utils.appendHeaders(operation, {
        Authorization: `Bearer ${token}`,
      });
    },
    didAuthError(error) {
      return error.graphQLErrors.some(e => e.extensions?.code === 'FORBIDDEN');
    },
    async refreshAuth() {
      const result = await utils.mutate(REFRESH, { token });
      if (result.data?.refreshLogin) {
        token = result.data.refreshLogin.token;
        refreshToken = result.data.refreshLogin.refreshToken;
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
      }
    },
  };
});
```
