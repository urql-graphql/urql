---
'@urql/exchange-graphcache': patch
---

Increase the consistency of when and how the `__typename` field is added to results. Instead of adding it by default and automatically first, the `__typename` field will now be added along with the usual selection set. The `write` operation will issue a warning if it's in the selection but missing in the result, as it should, and the `query` operation will add it as it did before but at the correct position of the result, assuming that it's in all selection sets. The slight change here is that it now won't be added to root results by default and only if it's being queried explicitly.
