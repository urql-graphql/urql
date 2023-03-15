---
'@urql/core': minor
---

Update `subscriptionExchange` to receive `FetchBody` instead. In the usual usage of `subscriptionExchange` (for instance with `graphql-ws`) you can expect no breaking changes. However, the `key` and `extensions` field has been removed and instead the `forwardSubscription` function receives the full `Operation` as a second argument.
