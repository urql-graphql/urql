---
'@urql/exchange-graphcache': minor
---

Add option `cleanOnEmptyCursors` to helper `relayPagination`. With this enabled, when resolve a page with both before & after cursors empty, cache for all prior & subsequent pages are invalidated, and will not be included in resolving outcome.
