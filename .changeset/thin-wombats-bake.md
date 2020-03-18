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
'@urql/svelte': patch
---

Fix Node.js Module support for v13 (experimental-modules) and v14. If your bundler doesn't support
`.mjs` files and fails to resolve the new version, please double check your configuration for
Webpack, or similar tools.
