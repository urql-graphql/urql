---
'@urql/exchange-graphcache': major
'@urql/svelte': major
'@urql/core': major
---

Update `OperationResult.hasNext` and `OperationResult.stale` to be required fields. If you have a custom exchange creating results, you'll have to add these fields or use the `makeResult`, `mergeResultPatch`, or `makeErrorResult` helpers.
