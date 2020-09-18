---
'@urql/exchange-graphcache': patch
---

Fix updaters config not working when Mutation/Subscription root names were altered.
For instance, a Mutation named `mutation_root` could cause `store.updates` to be misread and cause a
runtime error.
