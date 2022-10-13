---
'@urql/core': patch
'@urql/exchange-graphcache': patch
---

Fix operation identities preventing users from deeply cloning operation contexts. Instead, we now use a client-wide counter (rolling over as needed).
While this changes an internal data structure in `@urql/core` only, this change also affects the `offlineExchange` in `@urql/exchange-graphcache` due to it relying on the identity being previously an object rather than an integer.
