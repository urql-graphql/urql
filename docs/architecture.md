# Architecture

This cache is a normalised cache, this all sounds
good on paper but let's look at how this actually works.

## Data

Receiving data will write it to the cache, not by key like
the normal `urql-cache` but by entity. This means that we normalise
the full response by entity and links.
Every entity of this response is saved by `__typename`,
Links between these entities are kept, that way we can reconstruct
the data structure received from the responses.

## Dependencies

// TODO: wait for refactor
