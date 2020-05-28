---
'@urql/exchange-graphcache': minor
'@urql/exchange-multipart-fetch': minor
'@urql/exchange-persisted-fetch': minor
'@urql/exchange-populate': minor
'@urql/exchange-suspense': minor
'@urql/core': minor
'@urql/preact': minor
'urql': minor
---

Add ESM support by changing our DEV-checks from `process.env.NODE_ENV !== 'production'` to `typeof process !== 'undefined' &&process.env.NODE_ENV !== 'production'`
