---
'@urql/exchange-graphcache': patch
---

Update `cache` methods, for instance `cache.resolve`, to consistently accept the `parent` argument from `resolvers` and `updates` and alias it to the parent's key (which is usually found on `info.parentKey`). This usage of `cache.resolve(parent, ...)` was intuitive and is now supported as expected.
