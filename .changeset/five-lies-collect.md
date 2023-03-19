---
'@urql/core': patch
---

Update `Exchange` contract and `composeExchanges` utility to remove the need to manually call `share` on either incoming `Source<Operation>` or `forward()`’s `Source<OperationResult>`. This is now taken care of internally in `composeExchanges` and should make it easier for you to create custom exchanges and for us to explain them.
