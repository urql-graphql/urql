---
'@urql/core': patch
---

Fix mark `query.__key` as non-enumerable so `formatDocument` does not restore previous invocations when cloning the gql-ast.
