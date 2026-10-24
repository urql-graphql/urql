---
'@urql/preact': minor
---

Add a beta `useFragment` hook that suspends while a `@defer`-red fragment streams in and throws its GraphQL errors to the nearest error boundary if the deferred data fails to arrive. A suspended `useQuery` now keeps a streamed query alive, so the retry render joins the same stream instead of re-executing it.
