---
'@urql/exchange-graphcache': patch
---

When comparing selection-sets during `optimistic` mutations we shouldn't look at field-aliases but instead leverage field-names. This also removes the warning for missing fields in optimistic return values
