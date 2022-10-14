---
'@urql/exchange-graphcache': patch
---

Prevent cache misses from causing infinite network requests from being issued, when two operations manipulate each other while experiencing cache misses or are partially uncacheable.
