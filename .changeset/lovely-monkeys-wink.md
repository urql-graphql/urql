---
'@urql/exchange-graphcache': patch
---

Fix optimistic mutations containing partial results (`undefined` fields), which previously actually caused a hidden cache miss, which may then affect a subsequent non-optimistic mutation result.
