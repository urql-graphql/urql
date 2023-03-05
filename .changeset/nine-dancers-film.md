---
'@urql/core': minor
---

Update default `Accept` header to include `multipart/mixed` and `application/graphql-response+json`. The former seems to now be a defactor standard-accepted indication for support of the "Incremental Delivery" GraphQL over HTTP spec addition/RFC, and the latter is an updated form of the older `Content-Type` of GraphQL responses, so both the old and new one should now be included.
