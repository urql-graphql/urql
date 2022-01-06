---
'@urql/vue': patch
---

Exposed callUseQuery to allow executing queries in app setup functions.
Add clientId parameter to useClient and provideClient, as well as useQuery to support multi-client setups (Note: You must provide app.provide('\$myUrql', myUrqlClient) yourself).
Then it becomes trivial to write code like const useMyApiQuery = (args) => useQuery(args, '$myUrql') and provide this function across your app to execute queries against a concrete API Client

For example:

```ts
export function createApp() {
  const app = createApp();

  const myApiExchange = createSSRExchange({
    isClient: !import.meta.env.SSR,
    initialState: initialState?.myApi,
    staleWhileRevalidate: false,
  });
  const myApi = new Client({
    url: 'https://my-api.com',
    exchanges: [dedupExchange, cacheExchange, myApiExchange, fetchExchange],
  });
  app.provide('$myApi', myApi);

  const anotherApiExchange = createSSRExchange({
    isClient: !import.meta.env.SSR,
    initialState: initialState?.anotherApi,
    staleWhileRevalidate: false,
  });
  const anotherApi = new Client({
    url: 'https://another-api.com',
    exchanges: [dedupExchange, cacheExchange, anotherApiExchange, fetchExchange],
  });
  app.provide('$anotherApi', anotherApi);

  return app;
}

export function useMyApiQuery<T = any, V = object>(
  args: UseQueryArgs<T, V>
): UseQueryResponse<T, V> {
  return useQuery(args, '$myApi');
}

export function useAnotherApiQuery<T = any, V = object>(
  args: UseQueryArgs<T, V>
): UseQueryResponse<T, V> {
  return useQuery(args, '$anotherApi');
}
```
