---
'@urql/core': patch
---

Infer `Variables` from the document only in `GraphQLRequestParams` and the `Client`'s `query`, `readQuery`, `subscription` and `mutation` methods. Previously, `Variables` was also inferred from the passed `variables` object, so an object with a field the document's variables don't have, e.g. after a schema change, wasn't a type error. This matches the `execute` function returned by `useMutation`.
