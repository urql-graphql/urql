---
'@urql/core': patch
---

Fix error bubbling, when an error happened in the exchange-pipeline we would treat it as a GraphQL-error
