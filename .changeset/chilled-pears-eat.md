---
'@urql/exchange-graphcache': patch
---

Fix missing values cascading into lists causing a `null` item without the query being marked as stale and fetched from the API. This would happen in schema awareness when a required field, which isn't cached, cascades into a nullable list.
