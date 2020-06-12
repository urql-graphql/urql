---
title: Errors
order: 7
---

# Help!

**This document lists out all errors and warnings in `@urql/exchange-graphcache`.**

Any unexpected behaviour, condition, or error will be marked by an error or warning
in development, which will output a helpful little message. Sometimes however, this
message may not actually tell you everything about what's going on.

This is a supporting document that explains every error and attempts to give more
information on how you may be able to fix some issues or avoid these errors/warnings.

## (1) Invalid GraphQL document

> Invalid GraphQL document: All GraphQL documents must contain an OperationDefinition
> node for a query, subscription, or mutation.

There are multiple places where you're passing in GraphQL documents, either through
methods on `Cache` (e.g. `cache.updateQuery`) or via `urql` using the `Client` or
hooks like `useQuery`.

Your queries must always contain a main operation, so either a query, mutation, or
subscription. This error occurs when this is missing, because the `DocumentNode`
is maybe empty or only contains fragments.

## (2) Invalid Cache call

> Invalid Cache call: The cache may only be accessed or mutated during
> operations like write or query, or as part of its resolvers, updaters,
> or optimistic configs.

If you're somehow accessing the `Cache` (an instance of `Store`) outside of any
of the usual operations then this error will be thrown.

Please make sure that you're only calling methods on the `cache` as part of
configs that you pass to your `cacheExchange`. Outside of these functions the cache
must not be changed.

However when you're not using the `cacheExchange` and are trying to use the
`Store` on its own, then you may run into issues where its global state wasn't
initialised correctly.

This is a safe-guard to prevent any asynchronous work to take place, or to
avoid mutating the cache outside of any normal operation.

## (3) Invalid Object type

> Invalid Object type: The type `???` is not an object in the defined schema,
> but the GraphQL document is traversing it.

When you're passing an introspected schema to the cache exchange, it is
able to check whether all your queries are valid.
This error occurs when an unknown type is found as part of a query or
fragment.

Check whether your schema is up-to-date or whether you're using an invalid
typename somewhere, maybe due to a typo.

## (4) Invalid field

> Invalid field: The field `???` does not exist on `???`,
> but the GraphQL document expects it to exist.<br />
> Traversal will continue, however this may lead to undefined behavior!

Similarly to the previous warning, when you're passing an introspected
schema to the cache exchange, it is able to check whether all your queries are valid.
This warning occurs when an unknown field is found on a selection set as part
of a query or fragment.

Check whether your schema is up-to-date or whether you're using an invalid
field somewhere, maybe due to a typo.

As the warning states, this won't lead any operation to abort or an error
to be thrown!

## (5) Invalid Abstract type

> Invalid Abstract type: The type `???` is not an Interface or Union type
> in the defined schema, but a fragment in the GraphQL document is using it
> as a type condition.

When you're passing an introspected schema to the cache exchange, it becomes
able to deterministically check whether an entity in the cache matches a fragment's
type condition.

This applies to full fragments (`fragment _ on Interface`) or inline fragments
(`... on Interface`), that apply to interfaces instead of to a concrete object typename.

Check whether your schema is up-to-date or whether you're using an invalid
field somewhere, maybe due to a typo.

## (6) readFragment(...) was called with an empty fragment

> readFragment(...) was called with an empty fragment.
> You have to call it with at least one fragment in your GraphQL document.

You probably have called `cache.readFragment` with a GraphQL
document that doesn't contain a main fragment.

This error occurs when no main fragment can be found, because the `DocumentNode`
is maybe empty or does not contain fragments.

When you're calling a fragment method, please ensure that you're only passing fragments
in your GraphQL document. The first fragment will be used to start writing data.

## (7) Can't generate a key for readFragment(...)

> Can't generate a key for readFragment(...).
> You have to pass an `id` or `_id` field or create a custom `keys` config for `???`.

You probably have called `cache.readFragment` with data that the cache can't generate a
key for.

This may either happen because you're missing the `id` or `_id` field or some other
fields for your custom `keys` config.

Please make sure that you include enough properties on your data so that `readFragment`
can generate a key.

## (8) Invalid resolver data

> Invalid resolver value: The resolver at `???` returned an invalid typename that
> could not be reconciled with the cache.

This error may occur when you provide a cache resolver for a field using `resolvers` config.

The value that you returns needs to contain a `__typename` field and this field must
match the `__typename` field that exists in the cache, if any. This is because it's not
possible to return a different type for a single field.

Please check your schema for the type that your resolver has to return, then add a
`__typename` field to your returned resolver value that matches this type.

## (9) Invalid resolver value

> Invalid resolver value: The field at `???` is a scalar (number, boolean, etc),
> but the GraphQL query expects a selection set for this field.

The GraphQL query that has been walked contains a selection set at the place where
your resolver is located.

This means that a full entity object needs to be returned, but instead the cache
received a number, boolean, or another scalar from your resolver.

Please check that your resolvers return scalars where there's no selection set,
and entities where there is one.

## (10) writeOptimistic(...) was called with an operation that isn't a mutation

> writeOptimistic(...) was called with an operation that is not a mutation.
> This case is unsupported and should never occur.

This should never happen, please open an issue if it does. This occurs when `writeOptimistic`
attempts to write an optimistic result for a query or subscription, instead of a mutation.

## (11) writeFragment(...) was called with an empty fragment

> writeFragment(...) was called with an empty fragment.
> You have to call it with at least one fragment in your GraphQL document.

You probably have called `cache.writeFragment` with a GraphQL
document that doesn't contain a main fragment.

This error occurs when no main fragment can be found, because the `DocumentNode`
is maybe empty or does not contain fragments.

When you're calling a fragment method, please ensure that you're only passing fragments
in your GraphQL document. The first fragment will be used to start writing data.

## (12) Can't generate a key for writeFragment(...)

> Can't generate a key for writeFragment(...) data.
> You have to pass an `id` or `_id` field or create a custom `keys` config for `???`.

You probably have called `cache.writeFragment` with data that the cache can't generate a
key for.

This may either happen because you're missing the `id` or `_id` field or some other
fields for your custom `keys` config.

Please make sure that you include enough properties on your data so that `writeFragment`
can generate a key.

## (13) Invalid undefined

> Invalid undefined: The field at `???` is `undefined`, but the GraphQL query expects a
> scalar (number, boolean, etc) / selection set for this field.

As data is written to the cache, this warning is issued when `undefined` is encountered.
GraphQL results should never contain an `undefined` value, so this warning will let you
know which part of your result did contain `undefined`.

## (15) Invalid key

> Invalid key: The GraphQL query at the field at `???` has a selection set,
> but no key could be generated for the data at this field.
> You have to request `id` or `_id` fields for all selection sets or create a
> custom `keys` config for `???`.
> Entities without keys will be embedded directly on the parent entity.
> If this is intentional, create a `keys` config for `???` that always returns null.

This error occurs when the cache can't generate a key for an entity. The key
would then effectively be `null` and the entity won't be cached by a key.

Conceptually this means that an entity won't be normalised but will indeed
be cached by the parent's key and field, which is displayed in the first
part of the warning.

This may mean that you forgot to include an `id` or `_id` field.

But if your entity at that place doesn't have any `id` fields, then you may
have to create a custom `keys` config. This `keys` function either needs to
return a unique ID for your entity or it needs to explicitly return `null` to silence
this warning.

## (16) Heuristic Fragment Matching

> Heuristic Fragment Matching: A fragment is trying to match against the `???` type,
> but the type condition is `???`. Since GraphQL allows for interfaces `???` may be
> an interface.
> A schema needs to be defined for this match to be deterministic, otherwise
> the fragment will be matched heuristically!

This warning is issued on fragment matching. Fragment matching is the process
of matching a fragment against a piece of data in the cache and that data's `__typename`
field.

When the `__typename` field doesn't match the fragment's type, then we may be
dealing with an interface and/or enum. In such a case the fragment may _still match_
if it's referring to an interface (`... on Interface`). Graphcache is supposed to be
usable without much config, so what it does in this case is apply a heuristic match.

In a heuristic fragment match we check whether all fields on the fragment are present
in the cache, which is then treated as a fragment match.

When you pass an introspected schema to the cache, this warning will never be displayed
as the cache can then do deterministic fragment matching using schema information.

## (17) Invalid type

> Invalid type: The type `???` is used with @populate but does not exist.

When you're using the populate exchange with an introspected schema and add the
`@populate` directive to fields it first checks whether the type is valid and
exists on the schema.

If the field does not have sufficient type information because it doesn't exist
on the schema or does not match expectations then this warning is logged.

Check whether your schema is up-to-date or whether you're using an invalid
field somewhere, maybe due to a typo.

## (18) Invalid TypeInfo state

> Invalid TypeInfo state: Found no flat schema type when one was expected.

When you're using the populate exchange with an introspected schema, it will
start collecting used fragments and selection sets on all of your queries.
This error may occur if it hits unexpected types or inexistent types when doing so.

Check whether your schema is up-to-date or whether you're using an invalid
field somewhere, maybe due to a typo.

Please open an issue if it happens on a query that you expect to be supported
by the `populateExchange`.

## (19) Can't generate a key for invalidate(...)

> Can't generate a key for invalidate(...).
> You need to pass in a valid key (**typename:id) or an object with the "**typename" property and an "id" or "\_id" property.

You probably have called `cache.invalidate` with data that the cache can't generate a key for.

This may either happen because you're missing the `__typename` and `id` or `_id` field or if the last two
aren't applicable to this entity a custom `keys` entry.

## (20) Invalid Object type

> Invalid Object type: The type `???` is not an object in the defined schema,
> but the `keys` option is referencing it.

When you're passing an introspected schema to the cache exchange, it is
able to check whether your `opts.keys` is valid.
This error occurs when an unknown type is found in `opts.keys`.

Check whether your schema is up-to-date, or whether you're using an invalid
typename in `opts.keys`, maybe due to a typo.

## (21) Invalid mutation

> Invalid mutation field `???` is not in the defined schema but the `updates` option is referencing it.

When you're passing an introspected schema to the cache exchange, it is
able to check whether your `opts.updates.Mutation` is valid.
This error occurs when an unknown mutation field is found in `opts.updates.Mutation`.

Check whether your schema is up-to-date, or whether you've got a typo in `opts.updates.Mutation`.

## (22) Invalid subscription

> Invalid subscription field: `???` is not in the defined schema but the `updates` option is referencing it.

When you're passing an introspected schema to the cache exchange, it is
able to check whether your `opts.updates.Subscription` is valid.
This error occurs when an unknown subscription field is found in `opts.updates.Subscription`.

Check whether your schema is up-to-date, or whether you're using an invalid
subscription name in `opts.updates.Subscription`, maybe due to a typo.

## (23) Invalid resolver

> Invalid resolver: `???` is not in the defined schema, but the `resolvers`
> option is referencing it.

When you're passing an introspected schema to the cache exchange, it is
able to check whether your `opts.resolvers` is valid.
This error occurs when an unknown query, type or field is found in `opts.resolvers`.

Check whether your schema is up-to-date, or whether you've got a typo in `opts.resolvers`.

## (24) Invalid optimistic mutation

> Invalid optimistic mutation field: `???` is not a mutation field in the defined schema,
> but the `optimistic` option is referencing it.

When you're passing an introspected schema to the cache exchange, it is
able to check whether your `opts.optimistic` is valid.
This error occurs when a field in `opts.optimistic` is not in the schema's `Mutation` fields.

Check whether your schema is up-to-date, or whether you've got a typo in `Mutation` or `opts.optimistic`.

## (25) Invalid root traversal

> Invalid root traversal: A selection was being read on `???` which is an uncached root type.
> The `Mutation` and `Subscription` types are special Operation Root Types and cannot be read back
> from the cache.

In GraphQL every schema has three [Operation Root
Types](https://spec.graphql.org/June2018/#sec-Root-Operation-Types). The `Query` type is the only
one that is cached in Graphcache's normalized cache, since it's the root of all normalized cache
data, i.e. all data is linked and connects back to the `Query` type.

The `Subscription` and `Mutation` types are special and uncached; they may link to entities that
will be updated in the normalized cache data, but are themselves not cached, since they're never
directly queried.

When your schema treats `Mutation` or `Subscription` like regular entity types you may get this
warning. This may happen because you've used the default reserved names `Mutation` or `Subscription`
for entities rather than as special Operation Root Types, and haven't specified this in the schema.
Hence this issue can often be fixed by either enabling
[Schema Awareness](https://formidable.com/open-source/urql/docs/graphcache/schema-awareness/) or by
adding a `schema` definition to your GraphQL Schema like so:

```graphql
schema {
  query: Query
  mutation: YourMutation
  subscription: YourSubscription
}
```

Where `YourMutation` and `YourSubscription` are your custom Operation Root Types, instead of relying
on the default names `"Mutation"` and `"Subscription"`.
