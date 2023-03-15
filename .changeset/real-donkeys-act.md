---
'@urql/core': patch
---

Replace fetch source implementation with async generator implementation, based on Wonka's `fromAsyncIterable`.
This also further hardens our support for the "Incremental Delivery" specification and
refactors its implementation and covers more edge cases.
