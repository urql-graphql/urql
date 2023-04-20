---
'@urql/exchange-graphcache': patch
---

Apply `hasNext: true` and fallthrough logic to cached queries that contain deferred, uncached fields. Deferred query results will now be fetched against the API correctly, even if prior requests have been incomplete.
