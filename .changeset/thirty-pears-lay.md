---
'@urql/exchange-graphcache': minor
---

Allow `updates` config to react to arbitrary type updates other than just `Mutation` and `Subscription` fields.
You’ll now be able to write updaters that react to any entity field being written to the cache,
which allows for more granular invalidations. **Note:** If you’ve previously used `updates.Mutation`
and `updated.Subscription` with a custom schema with custom root names, you‘ll get a warning since
you’ll have to update your `updates` config to reflect this. This was a prior implementation
mistake!
