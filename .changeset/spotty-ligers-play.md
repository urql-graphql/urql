---
'@urql/core': minor
---

Add `Accept` header to GraphQL HTTP requests. This complies to the specification but doesn't go as far as sending `Content-Type` which would throw a lot of APIs off. Instead, we'll now be sending an accept header for `application/graphql+json, application/json` to indicate that we comply with the GraphQL over HTTP protocol.
This also fixes headers merging to allow overriding `Accept` and `Content-Type` regardless of the user options' casing.
