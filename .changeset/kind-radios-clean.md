---
'@urql/exchange-graphcache': patch
---

Changes some internals of how selections are iterated over and remove some private exports. This will have no effect or fixes on how Graphcache functions, but may improve some minor performance characteristics of large queries.
