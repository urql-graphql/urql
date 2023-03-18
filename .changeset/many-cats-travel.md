---
'@urql/svelte': major
---

Move `handler`, which combines subscription events, from `mutationStore` to `subscriptionStore`. It’s accidentally been defined and implemented on the wrong store and was meant to be on `subscriptionStore`.
