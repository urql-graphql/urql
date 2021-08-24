---
'@urql/exchange-graphcache': patch
---

Fix previous results' `null` values spilling into the next result that Graphcache issues, which may prevent updates from being issued until the query is reexecuted. This was affecting any `null` links on data, and any queries that were issued before non-optimistic mutations.
