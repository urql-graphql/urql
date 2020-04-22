---
'@urql/core': patch
---

Hoist variables in unminified build output for Metro Bundler builds which otherwise fails for `process.env.NODE_ENV` if-clauses.
