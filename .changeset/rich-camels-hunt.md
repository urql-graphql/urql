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

Fix node resolution when using Webpack, which experiences a bug where it only resolves
`package.json:main` instead of `module` when an `.mjs` file imports a package.
