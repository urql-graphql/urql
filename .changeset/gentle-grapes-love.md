---
'@urql/exchange-retry': minor
---

Add a second `Operation` input argument to the `retryIf` predicate, so that retrying can be actively avoided for specific types of operations, e.g. mutations or subscriptions, in certain user-defined cases.
