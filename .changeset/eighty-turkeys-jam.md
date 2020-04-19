---
'next-urql': patch
---

Check if urqlClient exists in useMemo on the server side to prevent calling clientConfig and initUrqlClient multiple times. Ensure urqlClient is serialized to null to maintain separate server and client instances.
