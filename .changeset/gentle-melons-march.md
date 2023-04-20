---
'@urql/exchange-graphcache': patch
---

Prevent reusal of incoming API data in Graphcache’s produced (“owned”) data. This prevents us from copying the `__typename` and other superfluous fields.
