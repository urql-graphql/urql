---
'@urql/exchange-graphcache': patch
---

Fix an edge-case for which an introspection query during runtime could fail when schema-awareness was enabled in Graphcache, since built-in types weren't recognised as existent.
