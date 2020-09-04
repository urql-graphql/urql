---
'@urql/core': patch
'@urql/exchange-multipart-fetch': patch
'@urql/exchange-persisted-fetch': patch
---

Don't set the "content-type" on the http-headers when using GET in the fetchExchange.
