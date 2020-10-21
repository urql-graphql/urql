---
'@urql/exchange-graphcache': patch
---

Enforce atomic optimistic updates so that optimistic layers are cleared before they're reapplied. This is important for instance when an optimistic update is performed while offline and then reapplied while online, which would previously repeat the optimistic update on top of its past data changes.
