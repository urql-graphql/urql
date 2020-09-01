---
'@urql/exchange-execute': patch
'@urql/exchange-multipart-fetch': patch
'@urql/core': patch
---

Clone the FetchResponse object before using the body, this way other exchanges can use it for other purposes.
