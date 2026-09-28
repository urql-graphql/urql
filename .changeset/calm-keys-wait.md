---
'@urql/exchange-graphcache': patch
---

Deduplicate cache misses and refetches of queries that already have a network request in flight. Previously, reexecuting a pending query repeatedly, e.g. when subscription events kept updating its dependencies, could send duplicate requests, including for partial or `cache-and-network` results.
