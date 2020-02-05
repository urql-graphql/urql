# Schema

As mentioned in the docs we allow for the schema to be passed
to the `cacheExchange` this allows for partial results in deterministic
fragment matching.
With deterministic fragment matching we mean that if you use an interface
or a union we will be 100% sure you're allowed to do so.

But how do you get this schema? Well let's consider some steps, first
make sure `introspection` is turned on on your server. This is very crucial
else your server won't allow the schema to be shown.

We can run a script that generates the introspection result like this:

```js
// import a fetch library for node.
import introspectionQuery from '@urql/exchange-graphcache/docs/introspectionQuery';
// or
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

next up we can just import this schema and add it to the cacheExchange:

```js
import schema from './schema.json';

const cache = cacheExchange({ schema });
```

This should do the trick, it's also possible to just open your playground
and manually execute the introspection with the query found [here](./introspectionQuery.js)
this one is the smallest representation.

> Note that our query can be unsuited for your case, it's best to resort to the one offered from graphql itself in that case
