---
'@urql/exchange-persisted-fetch': patch
---

Fix Crypto API support for Web Workers and Node Crypto in ESM mode. Previously, when Node Crypto was required in Node ESM mode it would result in an error instead, since we didn't try a dynamic import fallback.
