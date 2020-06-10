---
'@urql/exchange-graphcache': patch
---

Fix resolvers being execute for data even when data is currently written. This behaviour could lead to interference with custom updaters that update fragments or queries, e.g. an updater that was receiving paginated data due to a pagination resolver. We've determined that generally it is undesirable to have any resolvers run during the cache update (writing) process, since it may lead to resolver data being accidentally written to the cache or for resolvers to interfere with custom user updates.
