---
'@urql/exchange-graphcache': patch
---

Preserve the original `DocumentNode` AST when updating the cache, to prevent results after a network request from differing and breaking referential equality due to added `__typename` fields.
