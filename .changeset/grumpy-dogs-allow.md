---
'urql': patch
---

Fix issue with `useQuery`'s `executeQuery` state updates, where some calls wouldn't trigger a source change and start a request when the hook was paused.
