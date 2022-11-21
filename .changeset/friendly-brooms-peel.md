---
'@urql/exchange-auth': major
---

Split `getAuth` into two functions: `getInitialAuth` and `refreshAuth`. The existing `getAuth` is removed.

In order to improve developer experience, we're spliting the `getAuth` into two functions to more easily distinguish the two cases when it's called:
- `getInitialAuth` is called only once when the exchange first loads. It should be used to get any initial auth state (e.g. form a coolie or async storage)
- `refreshAuth` is called then `willAuthError` returns true, or when a request fails with an auth error (as determined by `didAuthError`)

In order to migrate: look at your application logic in `getAuth` and separate it into two parts. The logic for getting inital auth should go in `getInitialAuth` (remember, this will be called only once in the urql client lifecycle) and the refresh logic should go in `refreshAuth`.
