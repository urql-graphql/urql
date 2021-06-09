---
'@urql/core': patch
---

Prevent stale results from being emitted by promisified query sources, e.g. `client.query(...).toPromise()` yielding a partial result with `stale: true` set. Instead, `.toPromise()` will now filter out stale results.
