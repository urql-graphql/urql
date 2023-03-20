---
'@urql/core': patch
---

Allow any object fitting the `GraphQLError` shape to rehydrate without passing through a `GraphQLError` constructor in `CombinedError`.
