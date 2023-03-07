---
'@urql/exchange-auth': patch
---

Fix `willAuthError` not being called for operations that are waiting on the authentication state to update. This can actually lead to a common issue where operations that came in during the authentication initialization (on startup) will never have `willAuthError` called on them. This can cause an easy mistake where the initial authentication state is never checked to be valid.
