---
'@urql/core': patch
---

Fix generated empty `Variables` type as passed to generics, that outputs a type of `{ [var: string]: never; }`.
A legacy/unsupported version of `typescript-urql`, which wraps `urql`'s React hooks, generates
empty variables types as the following code snippet, which is not detected:

```ts
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
type Variables = Exact<{ [key: string]: never }>;
```
