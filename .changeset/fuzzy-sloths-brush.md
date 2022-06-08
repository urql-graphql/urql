---
'next-urql': patch
'urql': patch
'@urql/storybook-addon': patch
---

Fix Node.js ESM re-export detection for `@urql/core` in `urql` package and CommonJS output for all other CommonJS-first packages. This ensures that Node.js' `cjs-module-lexer` can correctly identify re-exports and report them properly. Otherwise, this will lead to a runtime error.
