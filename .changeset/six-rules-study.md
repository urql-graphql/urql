---
'@urql/core': major
---

Remove support for options on the `Client` and `Client.createOperationContext`. We've noticed that there's no real need for `createOperationContext` or the options on the `Client` and that it actually encourages modifying properties on the `Client` that are really meant to be modified dynamically via exchanges.
