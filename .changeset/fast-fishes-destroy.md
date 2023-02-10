---
'@urql/exchange-graphcache': patch
---

Fix potential data loss in `offlineExchange` that's caused when `onOnline` triggers and flushes mutation queue before the mutation queue is used.
