# Changelog

## 0.2.0

### Minor Changes

- Switch from a `focus-event` triggering the refetch to a change in [`page-visbility`](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API). This means that interacting with an `iframe` and then going back to the page won't trigger a refetch, interacting with Devtools won't cause refetches and a bubbled `focusEvent` won't trigger a refetch, by [@tatchi](https://github.com/tatchi) (See [#1077](https://github.com/FormidableLabs/urql/pull/1077))

## v0.1.0

**Initial Release**
