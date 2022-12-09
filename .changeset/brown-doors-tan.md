---
'@urql/exchange-graphcache': patch
'@urql/exchange-execute': patch
'@urql/core': patch
'next-urql': patch
'@urql/svelte': patch
'@urql/vue': patch
---

Fix type-generation, with a change in TS/Rollup the type generation took the paths as src and resolved them into the types dir
