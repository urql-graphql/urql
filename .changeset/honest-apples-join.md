---
'@urql/preact': major
'urql': major
---

Remove the default `Client` from `Context`. Previously, `urql` kept a legacy default client in its context, with default exchanges and calling an API at `/graphql`. This has now been removed and you will have to create your own `Client` if you were relying on this behaviour.
