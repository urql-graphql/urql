---
'@urql/exchange-graphcache': patch
---

Adjust mutation results priority to always override query results as they arrive, similarly to subscriptions. This will prevent race conditions when mutations are slow to execute at the cost of some consistency.
