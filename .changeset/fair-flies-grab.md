---
'@urql/core': minor
'@urql/preact': patch
'urql': patch
'@urql/svelte': patch
'@urql/vue': patch
---

Add a built-in `gql` tag function helper to `@urql/core`. This behaves similarly to `graphql-tag` but only warns about _locally_ duplicated fragment names rather than globally. It also primes `@urql/core`'s key cache with the parsed `DocumentNode`.
