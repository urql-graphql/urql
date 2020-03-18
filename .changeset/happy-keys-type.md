---
'@urql/exchange-graphcache': patch
---

Fix critical ordering bug in commutative queries and mutations. Subscriptions and queries would ad-hoc be receiving an empty optimistic layer accidentally. This leads to subscription results potentially being cleared, queries from being erased on a second write, and layers from sticking around on every second write or indefinitely. This affects versions `> 2.2.2` so please upgrade!
