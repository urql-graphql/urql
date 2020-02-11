---
'@urql/core': minor
'@urql/preact': minor
'urql': minor
---

Adds the `stripTypename` export to urql-core, this deeply makes `__typename` non-enumerable.
In (P)React we'll apply the above function on result payloads of mutations, subscriptions and mutations.
