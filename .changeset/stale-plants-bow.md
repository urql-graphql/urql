---
'@urql/exchange-graphcache': patch
'@urql/exchange-multipart-fetch': patch
---

Fix multipart conversion, in the `extract-files` dependency (used by multipart-fetch) there is an explicit check for the constructor property of an object. This made the files unretrievable.
