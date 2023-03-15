---
'@urql/core': minor
---

Update `subscriptionExchange` to support incremental results out of the box. If a subscription proactively completes, results are also now updated with `hasNext: false`.
