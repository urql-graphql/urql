---
'@urql/exchange-graphcache': patch
---

Add special-case for fetching an introspection result in our schema-checking, this avoids an error when urql-devtools fetches the backend graphql schema.
