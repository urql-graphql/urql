---
'@urql/core': patch
---

Fix inconsistency in generating keys for `DocumentNode`s, especially when using GraphQL Code Generator, which could cause SSR serialization to fail.
