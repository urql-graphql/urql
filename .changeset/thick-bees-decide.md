---
'@urql/exchange-graphcache': patch
---

Fix storage implementation not preserving deleted values correctly or erroneously checking optimistically written entries for changes. This is fixed by adding a new default serializer to the `@urql/exchange-graphcache/default-storage` implementation, which will be incompatible with the old one.
