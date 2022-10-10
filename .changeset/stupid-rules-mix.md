---
'@urql/core': patch
---

Fix operation identities preventing users from deeply cloning operation contexts. Instead, we now use a client-wide counter (rolling over as needed).
