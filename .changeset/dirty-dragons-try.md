---
'@urql/exchange-refocus': minor
---

Switch from a `focus-event` triggering the refetch to a change in [`page-visbility`](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API). This means that interacting with an `iframe` and then going back to the page won't trigger a refetch, interacting with Devtools won't cause refetches and a bubbled `focusEvent` won't trigger a refetch.
