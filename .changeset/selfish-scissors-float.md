---
'@urql/core': patch
---

Ensure we don't dispatch network-requests on getCurrentValue or subscriptions that will tear down early
