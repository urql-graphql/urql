---
'@urql/svelte': patch
---

Fix an issue where updated `context` options wouldn't cause a new query to be executed, or updates to the store would erroneously throw a debug error.
