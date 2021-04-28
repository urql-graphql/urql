---
'@urql/core': minor
---

Add consistent "single-source behavior" which makes the `Client` more forgiving when duplicate
sources are used, which previously made it difficult to use the same operation across an app
together with `cache-and-network`; This was a rare use-case, and it isn't recommended to overfetch
data across an app, however, the new `Client` implementation of shared sources ensures that when an
operation is active that the `Client` distributes the last known result for the active operation to
any new usages of it (which is called “replaying stale results”)

See: [#1515](https://github.com/FormidableLabs/urql/pull/1515)

