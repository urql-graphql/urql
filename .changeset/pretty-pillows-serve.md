---
'@urql/core': patch
'@urql/exchange-multipart-fetch': patch
'@urql/exchange-persisted-fetch': patch
---

Omit the `Content-Type: application/json` HTTP header when using GET in the `fetchExchange`, `persistedFetchExchange`, or `multipartFetchExchange`.
