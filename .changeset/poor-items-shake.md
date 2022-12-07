---
'@urql/exchange-graphcache': patch
---

Fix a deadlock condition in Graphcache's layers, which is caused by subscriptions (or other deferred layers) starting before one-off mutation layers. This causes the mutation to not be completed, which keeps its data preferred above the deferred layer. That in turn means that layers stop squashing, which causes new results to be missing indefinitely, when they overlap.
