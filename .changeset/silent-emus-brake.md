---
'@urql/core': patch
---

Fix subscriptions not being duplicated when `hasNext` isn't set. The `hasNext` field is an upcoming "Incremental Delivery" field. When a subscription result doesn't set it we now set it to `true` manually. This indicates to the `dedupExchange` that no duplicate subscription operations should be started.
