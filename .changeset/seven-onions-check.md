---
'@urql/exchange-graphcache': minor
---

Implement optimistic mutation result flushing. Mutation results for mutation that have had optimistic updates will now wait for all optimistic mutations to complete at the same time before being applied to the cache. This sometimes does delay cache updates to until after multiple mutations have completed, but it does prevent optimistic data from being accidentally committed permanently, which is more intuitive.
