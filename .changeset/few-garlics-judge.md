---
'@urql/exchange-graphcache': patch
---

Reset `partial` result marker when reading from selections when a child value sees a cache miss. This only affects resolvers on child values enabling `info.partial` while a parent may abort early instead.
