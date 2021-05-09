---
'@urql/core': patch
---

Fix a regression in `@urql/core@2.1.1` that prevented concurrent operations from being dispatched with differing request policies, which for instance prevented the explicit `executeQuery` calls on bindings to fail.
