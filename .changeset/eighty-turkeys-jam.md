---
'next-urql': patch
---

Ensure that the Next.js context is available during all stages of SSR. Previously a missing check in `useMemo` on the server-side caused `clientConfig` from being called repeatedly, and another issue may have caused the client from being serialized to initial props.
