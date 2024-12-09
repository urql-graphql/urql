---
'@urql/core': minor
---

Remove `addMetadata` transform where we'd strip out metadata for production environments, this particularly affects `OperationResult.context.metadata.cacheOutcome`
