---
'@urql/exchange-graphcache': minor
---

Issue warnings when an unknown type or field has been included in Graphcache's `opts` configuration to help spot typos.
Checks `opts.keys`, `opts.updates`, `opts.resolvers` and `opts.optimistic`.
See: [#820](https://github.com/FormidableLabs/urql/pull/820) and [#826](https://github.com/FormidableLabs/urql/pull/826)
