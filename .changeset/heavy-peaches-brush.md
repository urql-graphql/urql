---
'@urql/exchange-auth': patch
---

Fix an operation that triggers `willAuthError` with a truthy return value being sent off twice.
