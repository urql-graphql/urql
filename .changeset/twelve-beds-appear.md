---
'@urql/exchange-graphcache': patch
---

Fix referential equality preservation in Graphcache failing after API results, due to a typo writing the API result rather than the updated cache result.
