---
title: Schema Awareness
order: 4
---

# Schema Awareness

As mentioned in the docs we allow for the schema to be passed
to the `cacheExchange` this allows for partial results and deterministic
fragment matching.
With deterministic fragment matching we mean that if you use an interface
or a union we will be 100% sure you're allowed to do so, we'll check if the
type you request can actually be returned from this union/interface.

## Getting your schema

But how do you get this schema? Well let's consider some steps, first
make sure `introspection` is turned on on your server. This is very crucial
else your server won't allow the schema to be shown.

We can run a script that generates the introspection result like this:

```js
// import a fetch library for node.
import { getIntrospectionQuery } from 'graphql';

fetch('http://localhost:3000/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    variables: {},
    query: getIntrospectionQuery({ descriptions: false }),
  }),
})
  .then(result => result.json())
  .then(({ data }) => {
    fs.writeFile('./schema.json', JSON.stringify(data), err => {
      if (err) {
        console.error('Writing failed:', err);
        return;
      }
      console.log('Schema written!');
    });
  });
```

## Integrating

next up we can just import this schema and add it to the cacheExchange:

```js
import schema from './schema.json';

const cache = cacheExchange({ schema });
```

So what benefits do we have now that graphCache is aware of the shape of our schema?

### Partial results

Let's approach this with the example from [Computed queries](./computed-queries.md#resolve) we have
our `TodosQuery` result (a list) and now we want to get a specific `Todo` we wire these up through
`resolve` but we are missing an optional field for this, without a schema we don't know this is optional
and we will not show you the partial result. Now that we have a schema we can check if this is allowed to
be left out, we'll return you the entity and fetch the missing properties in the background.
