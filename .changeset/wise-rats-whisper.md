---
'@urql/exchange-graphcache': patch
---

Fix reusing original query data from APIs accidentally, which can lead to subtle mismatches in results when the API's incoming `query` results are being updated by the `cacheExchange`, to apply resolvers. Specifically this may lead to relations from being set back to `null` when the resolver returns a different list of links than the result, since some `null` relations may unintentionally exist but aren't related. If you're using `relayPagination` then this fix is critical.
