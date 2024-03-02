---
'@urql/exchange-graphcache': patch
---

Prevent `@defer` from being applied in child field selections. Previously, a child field (i.e. a nested field) under a `@defer`-ed fragment would also become optional, which was based on a prior version of the DeferStream spec which didn't require deferred fields to be delivered as a group.
