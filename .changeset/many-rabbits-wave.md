---
'@urql/svelte': patch
---

Fix `queryStore` and `subscriptionStore` not subscribing when `writable` calls its `StartStopNotifier`. This caused both stores to be inactive and become unresponsive when they’ve been unsubscribed from once, as they wouldn’t be able to restart their subscriptions to the `Client`.
