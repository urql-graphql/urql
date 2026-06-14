---
'@urql/vue': patch
---

Fix `await useQuery()` in Vue to wait on the composable's existing reactive state instead of creating an additional query source subscription.
