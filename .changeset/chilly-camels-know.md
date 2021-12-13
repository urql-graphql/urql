---
'@urql/exchange-execute': patch
---

Upgrade modular imports for graphql package, which fixes an issue in `@urql/exchange-execute`, where `graphql@16` files wouldn't resolve the old `subscribe` import from the correct file
