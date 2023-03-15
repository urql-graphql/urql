---
'@urql/exchange-auth': patch
'@urql/exchange-graphcache': patch
'@urql/core': patch
'@urql/preact': patch
'urql': patch
'@urql/svelte': patch
'@urql/vue': patch
---

Fix source maps included with recently published packages, which lost their `sourcesContent`, including additional source files, and had incorrect paths in some of them.
