---
'@urql/core': patch
---

Add fragment deduplication to `gql` tag. Identical fragments can now be interpolated multiple times without a warning being triggered or them being duplicated in `gql`'s output.
