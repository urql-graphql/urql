---
'next-urql': major
---

change how `getInitialProps` is applied, this will now be applied when the page wrapped in `withUrqlClient` implements `getInitialProps` or when you
pass it to the new second argument of `withUrqlClient`. This can be done like this:

```js
withUrqlClient(() => client, { ssr: true })(App);
```

This is to better support alternative methods like `getStaticProps`.
