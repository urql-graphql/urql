---
'@urql/exchange-graphcache': major
'@urql/core': major
---

Remove dependence on `graphql` package and replace it with `@0no-co/graphql.web`, which reduces the default bundlesize impact of `urql` packages to a minimum. All types should remain compatible, even if you use `graphql` elsewhere in your app, and if other dependencies are using `graphql` you may alias it to `graphql-web-lite`.
