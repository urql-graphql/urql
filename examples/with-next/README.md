# Integrating with Next

## getInitialProps

This is the output you'll get when you're using `{ ssr: true }`, this way urql will try to automate
as much for you as it possibly can by using a [`prepass`](https://github.com/FormidableLabs/react-ssr-prepass)
this means that every `useQuery` used in your virtual-dom will be ran, the data will be collected on the server
and hydrated on the client.

> NOTE: to reduce performance complexities try to keep this to top-level renders as this can amount to waterfalls.

## getStaticProps

This requires some manual work, when we look at [`static.js`](./pages/static.js) we can see that we define our own
`getStaticProps` method, this because these methods are only `user-facing`. When doing a `yarn next build` we'll need to
ensure that the server we're targetting is running so we can successfully execute the static prerender.

## getServerSideProps

This requires some manual work, when we look at [`server.js`](./pages/server.js) we can see that we define our own
`getServerSideProps` method, this because these methods are only `user-facing`.

## Output

We can see that our `/` and `/server` routes are rendered on the server and `/static` is statically prerendered.

```
Page                                                           Size     First Load JS
┌ λ /                                                          4.98 kB          90 kB
├   /_app                                                      0 B              85 kB
├ ○ /404                                                       3.46 kB        88.5 kB
├ λ /api/graphql                                               0 B              85 kB
├ λ /server                                                    878 B          85.9 kB
└ ● /static                                                    895 B          85.9 kB
+ First Load JS shared by all                                  85 kB
  ├ chunks/d8c192fcf6e34535672c13f111ef41e3832b265d.d03071.js  17.4 kB
  ├ chunks/f6078781a05fe1bcb0902d23dbbb2662c8d200b3.6a2b27.js  13.3 kB
  ├ chunks/framework.4b1bec.js                                 41.8 kB
  ├ chunks/main.3d1d43.js                                      7.14 kB
  ├ chunks/pages/_app.92bde8.js                                4.68 kB
  └ chunks/webpack.50bee0.js                                   751 B


λ  (Server)  server-side renders at runtime (uses getInitialProps or getServerSideProps)
○  (Static)  automatically rendered as static HTML (uses no initial props)
●  (SSG)     automatically generated as static HTML + JSON (uses getStaticProps)
   (ISR)     incremental static regeneration (uses revalidate in getStaticProps)
```
