---
'@urql/introspection': patch
---

Fix import of `executeSync` rather than `execute` causing an incompatibility when several `.mjs` imports and a main `import { executeSync } from 'graphql'` are causing two different modules to be instantiated.
