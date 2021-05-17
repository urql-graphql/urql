---
'@urql/exchange-graphcache': patch
---

Loosen type constraint on `ScalarObject` to account for custom scalar deserialization like `Date` for `DateTime`s.
