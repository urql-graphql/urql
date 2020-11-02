---
'@urql/exchange-graphcache': patch
'@urql/core': patch
'@urql/preact': patch
'urql': patch
'@urql/svelte': patch
---

Add support for `TypedDocumentNode` to infer the type of the `OperationResult` and `Operation` for all methods, functions, and hooks that either directly or indirectly accept a `DocumentNode`. See [`graphql-typed-document-node` and the corresponding blog post for more information.](https://github.com/dotansimha/graphql-typed-document-node)
