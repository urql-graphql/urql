---
'@urql/exchange-graphcache': minor
---

Improve referential equality of deeply queried objects from the normalised cache for queries. Each query operation will now reuse the last known result and only incrementally change references as necessary, scanning over the previous result to identify whether anything has changed.

While this affects our querying performance by about -20%, it should yield noticeable results in UI frameworks, where referential equality is often used to avoid work (e.g. in React with `useMemo` or `React.memo`). Overall, a 20% difference shouldn't be noticeable in day to day use given that we can read fairly typical queries over 10K times a second. ⚡
