---
'@urql/exchange-multipart-fetch': patch
---

Fix issue where we construct the fetchOptions before constructing the url resulting in our overflow fix not working
