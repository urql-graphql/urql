---
'@urql/core': patch
---

Increase strictness of merging incrementally delivered result payloads (e.g. for `fetchSubscriptions: true` or other streamed results). `hasNext` will now be set to `false` early if a non-incremental response (e.g. from subscriptions) has errored, and the fetch transport will now abort early if `hasNext` has been forced to `false`.
