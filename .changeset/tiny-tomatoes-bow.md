---
'@urql/exchange-graphcache': patch
'@urql/core': patch
---

Replace unnecessary `scheduleTask` polyfill with inline `Promise.resolve().then(fn)` calls.
