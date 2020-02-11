---
'@urql/core': minor
'@urql/preact': minor
'urql': minor
---

Add the `stripTypename` export to `@urql/core` to make all `__typename` fields non-enumerable.
In (P)React we'll apply the above function on result payloads of mutations, subscriptions and mutations.
