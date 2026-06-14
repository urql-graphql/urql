---
'@urql/core': patch
---

Emit terminal subscription results before ending completed subscriptions, preventing teardown races from dropping GraphQL errors.
