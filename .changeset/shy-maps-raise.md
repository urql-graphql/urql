---
'@urql/core': patch
---

Add case for `subscriptionExchange` to handle `GraphQLError[]` received in the `error` observer callback.
**Note:** This doesn't strictly check for the `GraphQLError` shape and only checks for arrays and receiving errors in the `ExecutionResult` on the `next` observer callback is preferred and recommended for transports.
