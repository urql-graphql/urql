---
title: Schema Awareness
order: 4
---

# Schema Awareness

As mentioned in the docs we allow for the schema to be passed
to the `cacheExchange`. This allows for partial results and deterministic
fragment matching. This schema argument is of type `IntrospectionQuery`, as JSON structure that
describes your entire server-side `GraphQLSchema`.

With deterministic fragment matching if we use an interface or a union _Graphcache_ can be 100% sure
what the expected types and shape of the data must be and whether the match is permitted. It also
enables a feature called ["Partial Results"](#partial-results).

## Getting your schema

But how do you get this introspected schema? The process of introspecting a schema is running an
introspection query on the GraphQL API, which will give us our `IntrospectionQuery` result. So an
introspection is just another query we can run against our GraphQL APIs or schemas.

As long as `introspection` as turned on and permitted, we can download an introspectin schema by
running a normal GraphQL query against the API and save the result in a JSON file.

```js
import { getIntrospectionQuery } from 'graphql';
import fetch from 'node-fetch'; // or your preferred request in Node.js
import * as fs from 'fs';

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

Alternatively, if you're already using [GraphQL Code Generator](https://graphql-code-generator.com/)
you can use [their `@graphql-codegen/introspection`
plugin](https://graphql-code-generator.com/docs/plugins/introspection) to do the same automatically
against a local schema. Furthermore it's also possible to
[`execute`](https://graphql.org/graphql-js/execution/#execute) the introspection query directly
against your `GraphQLSchema`.

## Optimizing a schema

An `IntrospectionQuery` JSON blob from a GraphQL API can without modification become quite large.
The shape of this data is `{ "__schema": ... }` and this _schema_ data will contain information on
all directives, types, input objects, scalars, deprecation, enums, and more. This can quickly add up and one of the
largest schemas, the GitHub GraphQL API's schema, has an introspection size of about 1.1MB, or about
50KB gzipped.

However, we can use the `@urql/introspection` package's `minifyIntrospectionQuery` helper to reduce
the size of this introspection data. This helper strips out information on directives, scalars,
input types, deprecation, enums, and redundant fields to only leave information that _Graphcache_
actually requires.

In the example of the GitHub GraphQL API this reduces the introspected data to around 20kB gzipped,
which is much more acceptable.

### Installation & Setup

First, install the `@urql/introspection` package:

```sh
yarn add @urql/introspection
# or
npm install --save @urql/introspection
```

You'll then need to integrate it into your introspection script or in another place where it can
optimise the introspection data. For this example, we'll just add it to the fetching script from
[above](#getting-your-schema).

```js
import { getIntrospectionQuery } from 'graphql';
import fetch from 'node-fetch'; // or your preferred request in Node.js
import * as fs from 'fs';

import { getIntrospectedSchema, minifyIntrospectionQuery } from '@urql/introspection';

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
    const minified = minifyIntrospectionQuery(getIntrospectedSchema(data));
    fs.writeFileSync('./schema.json', JSON.stringify(minified));
  });
```

The `getIntrospectionQuery` doesn't only accept `IntrospectionQuery` JSON data as inputs, but also
allows you to pass a JSON string, `GraphQLSchema`, or GraphQL Schema SDL strings. It's a convenience
helper and not needed in the above example.

## Integrating a schema

Once we have a schema that's already saved to a JSON file, we can load it and pass it to the
`cacheExchange`'s `schema` option:

```js
import schema from './schema.json';

const cache = cacheExchange({ schema });
```

It may be worth checking what your bundler or framework does when you import a JSON file. Typically
you can reduce the parsing time by making sure it's turned into a string and parsed using
`JSON.parse`

**What do we get from adding the schema to _Graphcache_?**

### Partial Results

Once _Schema Awareness_ is activated in _Graphcache_, it can use the schema to check which fields
and lists are marked as optional fields. This is then used to delivery partial results when
possible, which means that different queries may give you partial data where some uncached fields
have been replaced with `null`, while loading more data in the background, instead of our apps
having to wait for all data to be available.

Let's approach this with the example from ["Computed Queries"](./computed-queries.md#resolve): We
have our `TodosQuery` result which loads a list, and our app may want to get a specific `Todo` when
the app transitions to a details page. We may have already written a resolver that tells
_Graphcache_ what `Query.todo` does, but it may be missing some optional field to actuall give us
the full detailed `Todo`.

Without a schema _Graphcache_ would assume that because some fields are uncached and missing, it
can't serve this query's data. But if it has a schema, it may see that the uncached fields are
optional anyway and it can return a partial result for the `Todo` while it's fetching the full query
in the background, which in the `OperationResult` also causes `stale` to be set to `true`.

This means that _Schema Awareness_ can enable us to create apps that can display already cached data
on page transitions, while the page's full data loads in the background, which can often feel much
faster to the user.
