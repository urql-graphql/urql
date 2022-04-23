---
'@urql/exchange-graphcache': patch
---

Fix issues with continuously updating operations (i.e. subscriptions and `hasNext: true` queries) by shifting their layers in Graphcache behind those that are still awaiting a result. This causes continuous updates to not overwrite one-off query results while still keeping continuously updating operations at the highest possible layer.
