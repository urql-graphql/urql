---
'@urql/core': patch
---

Use `Record` over `object` type for subscription operation variables. The `object` type is currently hard to use ([see this issue](https://github.com/microsoft/TypeScript/issues/21732)).
