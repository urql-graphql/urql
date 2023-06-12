---
'@urql/exchange-graphcache': patch
---

Make "Invalid undefined" warning heuristic smarter and allow for partial optimistic results. Previously, when a partial optimistic result would be passed, a warning would be issued, and in production, fields would be deleted from the cache. Instead, we now only issue a warning if these fields aren't cached already.
