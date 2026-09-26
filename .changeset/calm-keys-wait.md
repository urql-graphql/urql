---
'@urql/exchange-graphcache': patch
---

Deduplicate cache misses of queries that already have a network request in flight. Previously, reexecuting a pending query repeatedly, e.g. when subscription events kept updating its dependencies, could send duplicate requests.
