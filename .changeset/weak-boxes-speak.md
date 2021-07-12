---
'@urql/exchange-auth': patch
---

Allow `mutate` to infer the result's type when a `TypedDocumentNode` is passed via the usual generics, like `client.mutation` for instance.
