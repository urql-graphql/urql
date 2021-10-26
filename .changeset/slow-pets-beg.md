---
'@urql/svelte': patch
---

Fix initialize `operationStore` with `fetching: false`, the invocation of `query` or any other operation will mark it as `true`
when deemed appropriate
