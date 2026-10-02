---
'urql': patch
---

Fix `useSubscription`'s `fetching` state to remain `true` while its source is active and become `false` when the source completes. Local React effect cleanup and stale sources no longer report a completed active subscription.
