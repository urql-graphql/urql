---
"@urql/preact": patch
"urql": patch
---

Fix issue where ssr would leak across renders even with new Clients, this was due to `useQuery` holding a global Map of operationKey to OperationResult.
