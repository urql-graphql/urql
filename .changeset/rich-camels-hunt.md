---
'@urql/exchange-graphcache': patch
'@urql/exchange-multipart-fetch': patch
'@urql/exchange-populate': patch
'@urql/exchange-retry': patch
'@urql/exchange-suspense': patch
'@urql/core': patch
'next-urql': patch
'@urql/preact': patch
'urql': patch
'urql-docs': patch
'@urql/svelte': patch
---

This fixes node-resolution when using Webpack, this bugged out when resolving nested modules since it would start to use pkg.json[main] instead of module.
