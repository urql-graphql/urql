---
'@urql/core': patch
---

Add missing `fetchSubscriptions` entry to `OperationContext`. The Client’s `fetchSubscriptions` now works properly and can be used to execute subscriptions as multipart/event-stream requests.
