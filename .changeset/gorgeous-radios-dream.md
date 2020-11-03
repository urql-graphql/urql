---
'@urql/core': patch
'@urql/preact': patch
'urql': patch
---

Refactor `useSource` hooks which powers `useQuery` and `useSubscription` to improve various edge case behaviour. This will not change the behaviour of these hooks dramatically but avoid unnecessary state updates when any updates are obviously equivalent and the hook will furthermore improve continuation from mount to effects, which will fix cases where the state between the mounting and effect phase may slightly change.
