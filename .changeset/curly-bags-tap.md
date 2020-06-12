---
'next-urql': patch
---

Prevent serialization of the `Client` for `withUrqlClient` even if the target component doesn't have a `getInitialProps` method. Before this caused the client to not be initialised correctly on the client-side.
