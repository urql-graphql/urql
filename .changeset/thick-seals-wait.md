---
"@urql/core": patch
---

Fix: update toPromise to exclude `hasNext` results. This change ensures that
when we call toPromise() on a query we wont serve an incomplete result, the
user will expect to receive a non-stale full-result when using toPromise()
