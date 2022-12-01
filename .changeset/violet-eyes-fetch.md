---
'@urql/core': minor
---

Implement `mapExchange`, which replaces `errorExchange`, allowing `onOperation` and `onResult` to be called to either react to or replace operations and results. For backwards compatibility, this exchange is also exported as `errorExchange` and supports `onError`.
