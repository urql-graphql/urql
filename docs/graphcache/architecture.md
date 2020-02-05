# Architecture

This cache implementation builds on the concept of normalisation,
we can use the naive implementation where we just refetch when we see
matches in `__typename` but in big connected applications this can
cause overhead and a lot of unnecessary fetches.

We need an approach where we can say, this is our response let's now
change the affected query data.

Let's look at a higher level how we tackle this.

## Incoming request

We have visited the exchanges before this one and now have our `OperationRequest`.
The first thing we should do is check what this operation entails, it would be useless
to start looking for a `subscription` or `mutation` in our cache.

In the event of it being a `subscription` we just go forward to the next exchange,
when we are dealing with a `mutation` we check if there are any [optimistic updates](./optimistic.md)
we have to deal with, if this is the case the callback implemented by the library consumer
will be executed with given variables.

In the event of a `query` there's a bit more that comes into play, first we check if the given
fields are present in our cache this starts with checking if there's a link from `Query` to our
requested field. We will keep traversing this querystring until we decide the query is incomplete,
partial or complete, partial is only supported when the cache has your [introspection schema](./schema.md),
during this traversal we will call your [resolvers](./resolvers.md) if this is needed.

When a query is incomplete we forward to the next exchange. Partial will result in it being returned as
partial data to the client AND a new `network-only` request to be fired to ensure the partial data is
populated. Complete will result depending in a return unless your requestPolicy is `cache-and-network`
this will return data and dispatch a request for your data to be refreshed.

> If you are curious this traversal happens in src/operation/query.ts and the decisions about the query
> are made in src/exchange.ts

## Incoming response

The request has completed and we have a response, let's tackle this like the request and look at it
by type.

When we get a response (or trigger) from a `subscription` classically the only thing that would happen
is your callback would fire. In this cache implementation you get the power to supply an [update](./updates.md)
function, this can be used to update the relevant query but even without an update function this will try
and look at the returned `__typename` and `identifier` if present and try to update a cache entry with it if
present. This is a powerful tool to keep your data updated, imagine we have a `subscription` that listens
to updates on our todos, if this query includes the identifier for that entity this will update the fields
where needed. When this is listening on somehting more complex like we want to add it to a list then you should
resort to the update function.

> Note that identifiers can be overwritten by the [keys config](./keys.md)

We've covered `subscription`, let's move on to `mutation`. Initially when we get a response the exchange will
check if there's an optimistic entry for this `mutation` if this is the case then we delete that entry since
we'll get the actual response (even if it is an error). The process of a `mutation` is very analogue to that
of a `subscription`, we check for an update function and if it's not there we try to automatically update the
data.

When we get a `query` response we just write this to the cache, nothing more.

Internally we keep track of dependant queries so we can notify them that their data was updated, this way our
React components can decide to rerender.

## Concluding

This does not only limit the amount of requests and so on, it also allows the application user to
have a better experience. Nobody likes to have a series of loading Spinners because data got invalidated.
