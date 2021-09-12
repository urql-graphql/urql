# @urql/graphcache-rn-async-storage

`@urql/graphcache-rn-async-storage` is a Graphcache offline storage for React Native.

It is compatible for both plain React Native and Expo apps (including managed workflow), but it has a two peer dependencies - [Async Storage](https://react-native-async-storage.github.io/async-storage/) and [NetInfo](https://github.com/react-native-netinfo/react-native-netinfo) - which must be installed separately. AsyncStorage will be used to persist the data, and NetInfo will be used to determine when the app is online and offline.

## Quick Start Guide

Install NetInfo ([RN](https://github.com/react-native-netinfo/react-native-netinfo) | [Expo](https://docs.expo.dev/versions/latest/sdk/netinfo/)) and AsyncStorage ([RN](https://react-native-async-storage.github.io/async-storage/docs/install) | [Expo](https://docs.expo.dev/versions/v42.0.0/sdk/async-storage/)).

Install `@urql/graphcache-rn-async-storage` alongside `urql` and `@urql/exchange-graphcache`:

```sh
yarn add @urql/graphcache-rn-async-storage
# or
npm install --save @urql/graphcache-rn-async-storage
```

Then add it to the offline exchange:

```js
import { createClient, dedupExchange, fetchExchange } from 'urql';
import { offlineExchange } from '@urql/exchange-graphcache';
import { makeAsyncStorage } from '@urql/graphcache-rn-async-storage';

const storage = makeAsyncStorage({
  dataKey: 'graphcache-data', // the AsyncStorage key used for the data (defaults to graphcache-data)
  metadataKey: 'graphcache-metadata', // the AsyncStorage key used for the metadata (defaults to graphcache-metadata)
  maxAge: 7 // how long to persist the data in storage (defaults to 7 days)
});

const cache = offlineExchange({
  schema,
  storage,
  updates: {
    /* ... */
  },
  optimistic: {
    /* ... */
  },
});

const client = createClient({
  url: 'http://localhost:3000/graphql',
  exchanges: [dedupExchange, cache, fetchExchange],
});
```
