---
'@urql/exchange-graphcache': minor
---

Add `cache.link(...)` method to Graphcache. This method may be used in updaters to update links in the cache. It is hence the writing-equivalent of `cache.resolve()`, which previously didn't have any equivalent as such, which meant that only `cache.updateQuery` or `cache.writeFragment` could be used, even to update simple relations.
