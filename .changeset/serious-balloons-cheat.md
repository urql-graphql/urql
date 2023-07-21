---
'urql': patch
---

Fix edge case that causes execute functions from `useQuery` and `useSubscription` to fail when they’re called in their state after a render that changes `pause`. This would previously cause internal dependencies to be outdated and the source to be discarded immediately in some cases.
