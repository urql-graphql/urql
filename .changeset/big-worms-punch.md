---
'@urql/exchange-persisted-fetch': major
---

Make the persistedFetchExchange accept an optional argument, this argument consists of one option `preferGetForPersistedQueries`.

To migrate you will have to change from

```js
import { persistedFetchExchange } from '@urql/exchange-persisted-fetch';

createClient({
  exchanges: [persistedFetchExchange],
});
```

to

```js
import { persistedFetchExchange } from '@urql/exchange-persisted-fetch';

createClient({
  exchanges: [persistedFetchExchange()],
});
```
