---
title: Server-side Rendering
order: 2
---

# Server-side Rendering

`urql` supports server-side rendering through the `ssrExchange`, this exchange
will gather all results that are fetched during the server side render and store
them. This data can then be used on the client when the application is being
hydrated.

## Setting up

To start out with the `ssrExchange` we have to add the exchange

```js
const isClient = typeof window !== 'undefined';
const ssr = ssrExchange({
  initialData: isClient ? window.URQL_DATA : undefined,
  // This will need to be passed explicitly to ssrExchange:
  isClient: !!isClient
});

const client = createClient({
  exchanges: [
    dedupExchange,
    cacheExchange,
    ssr,
    fetchExchange,
  ]
})
```

The `ssrExchange` allows you to pass in an object with two options, one being `isClient`,
this option tells the exchange you're in the browser rather than in the process of a server-side
render. The other option is called `initialState`, this being a mapping of `operationKey` to `operationResult`,
this could for instance be `window.__URQL_DATA__`.

The returned exchange will have two methods available on it, `restoreData` and `extractData`, during your ssr
we extract the gathered data and serialize it into a `<script>` tag inside head, this should bind it to a unique
property on `window` for instance `window.__URQL_DATA__`.

When `isClient` is true it will use the `initialState` to restore the gathered data.

## Next

We have a custom integration with [`Next.js`](https://nextjs.org/), being [`next-urql`](https://github.com/FormidableLabs/next-urql)
this integration contains convenience methods specifically for `Next.js`.
These will simplify the above setup for SSR.
