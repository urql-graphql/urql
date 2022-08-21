---
"@urql/core": patch
---

fix setting a client default requestPolicy, we set `context.requestPolicy: undefined`
from our bindings which makes a spread override the client-set default.
