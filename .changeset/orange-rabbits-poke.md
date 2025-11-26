---
'@urql/exchange-graphcache': major
---

Don't serialize data to IDB. This invalidates all existing data, but greatly improves performance of read/write operations.
