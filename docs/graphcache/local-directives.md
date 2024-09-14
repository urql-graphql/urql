---
title: Local Directives
order: 3
---

# Local Directives

Previously, we've learned about local resolvers [on the "Normalized Caching"
page](./normalized-caching.md#manually-resolving-entities) and [the "Local Resolvers" page](./local-resolvers.md).

Resolvers allow us to change the data that Graphcache resolvers for a given field on a given type.
This, in turn, allows us to change which links and data are returned in a query’s result, which
otherwise may not be cached or be returned in a different shape.

Resolvers are useful to globally change how a field behaves, for instance, to tell Graphcache that
a `Query.item(id: $id)` field returns an item of type `Item` with the `id` field, or to transform
a value before it’s used in the UI.

However, resolvers are limited to changing the behaviour globally, not to change a field’s behaviour
per query. This is why **local directives** exist.

## Adding client-only directives

Any directive in our GraphQL documents that’s prefixed with an underscore character (`_`) will be
filtered by `@urql/core`. This means that our GraphQL API never sees it and it becomes
a “client-only directive”.

No matter whether we prefix a directive or not however, we can define local resolvers for directives
in Graphcache’s configuration and make conditional local resolvers.

```js
cacheExchange({
  directives: {
    pagination(directiveArgs) {
      // This resolver is called for @_pagination directives
      return (parent, args, cache, info) => {
        return null;
      };
    },
  },
});
```

Once we define a directive on the `directives` configuration object, we can reference it in our
GraphQL queries.

As per the above example, if we now reference `@_pagination` in a query, the resolver that’s
returned in the configuration will be applied to the field, just like a local resolver.

We can also reference the directive using `@pagination`, however, this will mean that it’s
also sent to the API, so this usually isn’t what we want.

## Client-controlled Nullability

Graphcache comes with two directives built-in by default. The `optional` and `required` directives.
These directives can be used as an alternative to [the Schema Awareness
feature’s](./schema-awareness.md) ability to generate partial results.

If we were to write a query that contains `@_optional` on a field, then the field is always allowed to be
nullable. In case it’s not cached, Graphcache will be able to replace it with a `null`
value.

Similarly, if we annotate a field with `@_required`, the value is not optional and, even if the
cache knows the value is set to `null`, it will become required and Graphcache will either cascade
to the next higher parent field annotated with `@_optional`, or will mark a query as a cache-miss.

## Pagination

Previously, in [the “Local Resolvers” page’s Pagination section](./local-resolvers.md#pagination) we
defined a local resolver to add infinite pagination to a given type’s field.

If we add the `simplePagination` or `relayPagination` helpers as directives instead, we can still
use our schema’s pagination field as normal, and instead, only use infinite pagination as required.

```js
import { simplePagination } from '@urql/exchange-graphcache/extras';
import { relayPagination } from '@urql/exchange-graphcache/extras';

cacheExchange({
  directives: {
    simplePagination: options => simplePagination({ ...options }),
    relayPagination: options => relayPagination({ ...options }),
  },
});
```

Defining directives for our resolver factory functions means that we can now use them selectively.

```graphql
{
  todos(first: 10) @_relayPagination(mergeMode: "outwards") {
    id
    text
  }
}
```

### Reading on

[On the next page we'll learn about "Cache Updates".](./cache-updates.md)
