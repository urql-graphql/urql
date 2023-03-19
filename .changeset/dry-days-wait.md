---
'@urql/core': patch
---

Allow `makeOperation` to be called with a partial `OperationContext` when it’s called to copy an operation. When it receives an `Operation` as a second argument now, the third argument, the context, will be spread into the prior `operation.context`.
