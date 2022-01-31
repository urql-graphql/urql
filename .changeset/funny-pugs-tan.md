---
'urql': patch
---

Update `useQuery` implementation to avoid an aborted render on initial mount. We abort a render-on-update once when the state needs to be updated according to the `OperationResult` source we need to listen to and execute. However, we can avoid this on the initial mount as we've done in a prior version. This fix **does not** change any of the current behaviour, but simply avoids the confusing state transition on mount.
