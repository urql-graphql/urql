---
'@urql/exchange-execute': minor
---

The `context` option, which may be set to a context value or a function returning a context, can now return a `Promise` and will be correctly resolved and awaited.
