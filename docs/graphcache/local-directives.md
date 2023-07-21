---
title: Local Directives
order: 3
---

# Local Directives

Graphcache supports adding directives to GraphQL Documents, when we prefix a
directive with an underscore (`_`) it will be stripped from the document and stored
on the `_directives` property on the AST-node.

> Ensure you prefix directives with `_` if you only want to alter local behavior.

By default graphcache will add two directives `@_optional` and `@_required` which
allow you to mark fields as being optional or mandatory.

If you want to add directives yourself you can do so by performing

```js
cacheExchange({
  directives: {
    // If you now add `@_pagination` to your document we will execute this
    pagination: directiveArguments => () => {
      /* Resolver */
    },
  },
});
```

The function signature of a directive is a function which receives the arguments the directive is called with in the document.
That function should returns a [Resolver](./local-directives.md).

### Reading on

[On the next page we'll learn about "Cache Updates".](./cache-updates.md)
