---
'@urql/exchange-populate': patch
---

Fix the scenario where we traverse a query but end up in a nested fragment, this maks it so that we can't derive the type for the sub-entity
