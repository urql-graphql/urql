---
'@urql/exchange-retry': minor
---

Reset `retryExchange`’s previous attempts and delay if an operation succeeds. This prevents the exchange from keeping its old retry count and delay if the operation delivered a result in the meantime. This is important for it to help recover from failing subscriptions.
