---
'@urql/core': patch
---

Infer `Variables` from a typed document in `GraphQLRequestParams` and the `Client`'s `query`, `readQuery`, `subscription` and `mutation` methods. Previously, the passed `variables` object took precedence whenever it was assignable to the document's variables, so an object with an extra field, e.g. after a schema change, wasn't a type error. This matches the `execute` function returned by `useMutation`. Untyped documents still infer `Variables` from the passed object.
