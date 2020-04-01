---
'@urql/exchange-multipart-fetch': patch
'@urql/core': patch
---

Fix non-2xx results never being parsed as GraphQL results. This can result in valid GraphQLErrors being hidden, which should take precedence over generic HTTP NetworkErrors.
