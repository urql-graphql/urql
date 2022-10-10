---
'@urql/exchange-graphcache': patch
---

Fix case where dependent operations would keep re-triggering each other because their dependencies overlapped with differnt operation-keys
