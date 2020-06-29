---
'@urql/core': patch
---

Fix `formatDocument` mutating parts of the `DocumentNode` which may be shared by other documents and queries. Also ensure that a formatted document will always generate the same key in `createRequest` as the original document.
