---
'@urql/exchange-graphcache': patch
---

Ensure in-flight queries updated or invalidated by a subscription result are always refetched once their in-flight request completes, even when `Client.reexecuteOperation` deduplicates the intermediate `cache-first` reexecute.
