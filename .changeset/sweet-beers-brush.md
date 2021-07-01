---
'@urql/exchange-request-policy': patch
---

Do not set the TTL unless cache outcome is "miss". Previously we set the TTL on cache "miss" if it was the first time an operation returned a result, now the TTL is only set on cache miss results. This allows the request policy exchange to work when using persisted caching.
