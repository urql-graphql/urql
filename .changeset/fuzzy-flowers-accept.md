---
'@urql/svelte': patch
---

Replace `void` union types with `undefined` in `OperationStore` to allow nullish property access in TypeScript.
