---
'@urql/vue': minor
---

Provide the client as a ref so it can observe changes. This change is potentially breaking for
anyone using the `useClient` import as it will now return a `Ref<Client>` rather than a `Client`
