---
'urql': patch
---

Fix issue where `useSubscription` would endlessly loop when the callback wasn't memoized
