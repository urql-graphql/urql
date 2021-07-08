---
"@urql/exchange-graphcache": patch
---

Fix issue where operations that get dispatched synchronously after the cache restoration completes get forgotten.
