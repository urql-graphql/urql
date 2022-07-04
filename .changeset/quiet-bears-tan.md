---
'@urql/introspection': patch
---

Avoid making the imports of `@urql/introspection` more specific than they need to be, this because we aren't optimizing for bundle size and in pure node usage this can confuse Node as `import x from 'graphql'` won't share the same module scope as `import x from 'graphql/x/y.mjs'`
