---
'@urql/exchange-multipart-fetch': minor
'@urql/exchange-graphcache': minor
'@urql/exchange-persisted': minor
'@urql/exchange-context': minor
'@urql/exchange-execute': minor
'@urql/exchange-retry': minor
'@urql/exchange-auth': minor
---

Update exchanges to drop redundant `share` calls, since `@urql/core`’s `composeExchanges` utility now automatically does so for us.
