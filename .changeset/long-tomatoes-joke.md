---
'next-urql': major
---

Rmove global client var from our `init-urql-client` method, this impacts applications that rely on
the client being shared across wrapped `pages/` a migration path is to wrap `_app` instead.
