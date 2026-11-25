---
'urql': minor
---

Add a beta `useFragment` hook that suspends while a `@defer`-red fragment streams in, including during server streaming, and throws its GraphQL errors to the nearest error boundary if the deferred data fails to arrive.
