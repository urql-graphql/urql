---
'@urql/exchange-graphcache': patch
---

Fix optimistic updates not being allowed to be cumulative and apply on top of each other. Previously in [#866](https://github.com/FormidableLabs/urql/pull/866) we explicitly deemed this as unsafe which isn't correct anymore given that concrete, non-optimistic updates are now never applied on top of optimistic layers.
