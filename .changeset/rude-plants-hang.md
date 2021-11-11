---
'@urql/exchange-graphcache': minor
---

Expose a way to interact with the cache outside of operations.

We've repeatedly seen the need for people to update data coming from external sources (socket.io,...) outside of GraphQL
so with this feature we want to enable this once and for all. Our stance towards this has been hesitant because of the unintended
side-effects that might be created by doing this so this should be considered an escape hatch.

From now we can use the `cacheExchange().store` method when we use `graphCache`, the signature of this method can be found [here](https://formidable.com/open-source/urql/docs/api/graphcache/#cache)
