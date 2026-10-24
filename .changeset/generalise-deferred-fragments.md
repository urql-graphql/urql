---
'@urql/core': minor
---

Add beta `makeFragmentStore` and `makeFragmentSource` utilities, which read a fragment reference and, when its parent query spread it with `@defer`, report it as fetching until the deferred patch streams in, or as an error scoped to the fragment's path if the patch never arrives.
