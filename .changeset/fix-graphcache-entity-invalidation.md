---
'@urql/exchange-graphcache': patch
---

fix(graphcache): preserve entity data when creating new entities

Previously, when a mutation created a truly new entity, graphcache would incorrectly invalidate existing entities of the same type. This caused unnecessary refetches and component suspensions.

The fix checks if an entity existed before writing mutation data and only auto-invalidates existing entities with no references.
