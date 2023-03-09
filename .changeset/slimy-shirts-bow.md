---
'@urql/preact': patch
'@urql/svelte': patch
'urql': patch
'@urql/vue': patch
---

Fix type utilities turning the `variables` properties optional when a type from `TypedDocumentNode` has no `Variables` or all optional `Variables`. Previously this would break for wrappers, e.g. in code generators, or when the type didn't quite match what we'd expect.
