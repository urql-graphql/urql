---
"@urql/core": patch
---

Filter `network-only` requests from the `ssrExchange`, this is to enable `staleWhileRevalidated` queries to successfully dispatch their queries
