---
'@urql/exchange-graphcache': patch
---

Fix a stray `operationName` deprecation warning in `@urql/exchange-graphcache`'s exchange logic, which adds the `meta.cacheOutcome` field to the operation's context.
