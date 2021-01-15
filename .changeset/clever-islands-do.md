---
'@urql/core': patch
---

Add a workaround for `graphql-tag/loader`, which provides filtered query documents (where the original document contains multiple operations) without updating or providing a correct `document.loc.source.body` string.
