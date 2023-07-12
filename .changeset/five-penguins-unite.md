---
'@urql/exchange-persisted': patch
---

Fix `persistedExchange` ignoring teardowns in its initial operation mapping. Since the hash function is promisified, which defers any persisted operation, it needs to respect teardowns.
