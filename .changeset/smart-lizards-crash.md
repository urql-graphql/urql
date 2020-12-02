---
'@urql/exchange-graphcache': minor
---

Increase the consistency of when and how the `__typename` field is added to results. Instead of
adding it by default and automatically first, the `__typename` field will now be added along with
the usual selection set. The `write` operation now automatically issues a warning if `__typename`
isn't present where it's expected more often, which helps in debugging. Also the `__typename` field
may now not proactively be added to root results, e.g. `"Query"`.
