---
"@urql/exchange-graphcache": patch
---

Fix case where a mutation would also be counted in the loop-protection, this prevented partial queries from initiating refetches
