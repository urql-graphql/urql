---
'@urql/exchange-graphcache': minor
---

Improve referential equality of deeply queried objects from the normalised cache for queries. Each query operation will now reuse the last known result and only incrementally change references as necessary, scanning over the previous result to identify whether anything has changed.
This should help improve the performance of processing updates in UI frameworks (e.g. in React with `useMemo` or `React.memo`).
See: [#1859](https://github.com/FormidableLabs/urql/pull/1859)
