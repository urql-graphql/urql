---
'@urql/exchange-graphcache': patch
---

Fix regression which caused `@defer` directives from becoming “sticky” and causing every subsequent cache read to be treated as if the field was deferred.
