---
'@urql/exchange-graphcache': patch
---

Apply commutative layers to all operations, so now including mutations and subscriptions, to ensure that unordered data is written in the correct order.
