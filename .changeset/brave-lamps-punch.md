---
'@urql/exchange-graphcache': patch
---

Use new `FormattedNode` / `formatDocument` functionality added to `@urql/core` to slightly speed up directive processing by using the client-side `_directives` dictionary that `formatDocument` adds.
