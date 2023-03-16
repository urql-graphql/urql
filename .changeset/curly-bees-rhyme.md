---
'@urql/core': minor
---

Return a new `OperationResultSource` from all `Client` methods (which replaces `PromisifiedSource` on shortcut methods). This allows not only `toPromise()` to be called, but it can also be used as an awaitable `PromiseLike` and has a `.subscribe(onResult)` method aliasing the subscribe utility from `wonka`.
