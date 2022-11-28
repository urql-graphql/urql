---
'@urql/svelte': patch
'@urql/vue': patch
'@urql/core': patch
---

Move remaining `Variables` generics over from `object` default to `Variables extends AnyVariables = AnyVariables`. This has been introduced previously in [#2607](https://github.com/urql-graphql/urql/pull/2607) but some missing ports have been missed due to TypeScript not catching them previously. Depending on your TypeScript version the `object` default is incompatible with `AnyVariables`.
