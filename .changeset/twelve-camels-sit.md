---
'urql': major
'@urql/preact': major
---

**Breaking**: Remove `pollInterval` option from `useQuery`. Instead please consider using `useEffect` calling `executeQuery` on an interval.
