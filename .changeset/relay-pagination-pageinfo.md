---
'@urql/exchange-graphcache': patch
---

Fix `relayPagination` dropping `pageInfo` fields reported by the server: a forward (`after`) page's `startCursor`/`hasPreviousPage` and a backward (`before`) page's `endCursor`/`hasNextPage` were omitted from the merged result, so e.g. `hasPreviousPage` came back as `false` even when the server returned `true` for the only cached page.
