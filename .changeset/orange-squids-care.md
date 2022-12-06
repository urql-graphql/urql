---
'@urql/exchange-graphcache': patch
---

Add skipping of garbage collection runs when the cache is waiting for optimistic, deferred or other results in layers. This means that we only take an opportunity to run garbage collection after results have settled and are hence decreasing the chance of hogging the event loop when a run isn't needed.
