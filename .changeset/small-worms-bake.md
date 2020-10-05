---
'@urql/exchange-graphcache': patch
---

Fix inline fragments being skipped when they were missing a full type condition as per the GraphQL spec (e.g `{ ... { field } }`)
