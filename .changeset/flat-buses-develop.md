---
'@urql/exchange-graphcache': patch
'@urql/exchange-multipart-fetch': patch
'@urql/exchange-persisted-fetch': patch
'@urql/exchange-populate': patch
'@urql/exchange-retry': patch
'@urql/core': patch
'@urql/preact': patch
'@urql/svelte': patch
---

Add a `"./package.json"` entry to the `package.json`'s `"exports"` field for Node 14. This seems to be required by packages like `rollup-plugin-svelte` to function properly.
