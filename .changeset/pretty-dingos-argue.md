---
"urql": patch
---

fix issue with concurrent identical queries in the `next-urql` prepass where not cleaning up the memo closure becomes an infinite loop
