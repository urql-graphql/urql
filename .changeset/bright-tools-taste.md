---
'@urql/exchange-graphcache': patch
---

Fix up internal types in Graphcache to improve their accuracy for catching more edge cases in its implementation. This only affects you if you previously imported any type related to `ScalarObject` from Graphcache which now is a more opaque type. We've also adjusted the `NullArray` types to be potentially nested, since lists in GraphQL can be nested arbitarily, which we were covering but didn't reflect in our types.
