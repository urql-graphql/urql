---
'@urql/core': patch
---

Deduplicate operations as the `dedupExchange` did; by filtering out duplicate operations until either the original operation has been cancelled (teardown) or a first result (without `hasNext: true`) has come in.
