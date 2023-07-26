---
'@urql/exchange-graphcache': minor
---

Allow scalar values on the parent to be accessed from `parent[info.fieldName]` consistently. Prior to this change `parent[fieldAlias]` would get populated, which wouldn’t always result in a field that’s consistently accessible.
