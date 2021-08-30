---
'@urql/exchange-graphcache': patch
---

Remove `hasNext: true` flag from stale responses. This was erroneously added in debugging, but leads to stale responses being marked with `hasNext`, which means the `dedupExchange` will keep waiting for further network responses.
