---
'@urql/core': major
---

Remove `defaultExchanges` from `@urql/core` and make `exchanges` a required property on `Client` construction.
In doing so we make the `urql` package more tree-shakeable as the three default exchanges are in no code paths
meaning they can be removed if not used.

A migration would look as follows if you are currently creating a client without exchanges

```js
import { createClient, cacheExchange, fetchExchange } from '@urql/core'

const client = createClient({
  url: '',
  exchanges: [cacheExchange, fetchExchange]
});
```
