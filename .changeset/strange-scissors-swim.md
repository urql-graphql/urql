---
'@urql/exchange-graphcache': patch
---

Fix a Relay Pagination edge case where overlapping ends of pages queried using the `last` argument would be in reverse order.
