---
title: Schema Awareness
order: 4
---

# Schema Awareness

Previously, [on the "Normalized Caching" page](./normalized-caching.md) we've seen how Graphcache
stores normalized data in its store and how it traverses GraphQL documents to do so. What we've seen
is that just using the GraphQL document for traversal, and the `__typename` introspection field
Graphcache is able to build a normalized caching structure that keeps our application up-to-date
across API results, allows it to store data by entities and keys, and provides us configuration
options to write [manual cache updates](./cache-updates.md) and [local
resolvers](./local-resolvers.md).

While this is all possible without any information about a GraphQL API's schema, the `schema` option
on `cacheExchange` allows us to pass an introspected schema to Graphcache:

```js
const introspectedSchema = {
  __schema: {
    queryType: { name: 'Query', },
    mutationType: { name: 'Mutation', },
    subscriptionType: { name: 'Subscription', },
  },
};

cacheExchange({ schema: introspectedSchema });
```

In GraphQL, [APIs allow for the entire schema to be
"introspected"](https://graphql.org/learn/introspection/), which are special GraphQL queries that
give us information on what the API supports. This information can either be retrieved from a
GraphQL API directly or from the GraphQL.js Schema and contains a list of all types, the types'
fields, scalars, and other information.

In Graphcache we can pass this schema information to enable several features that aren't enabled if
we don't pass any information to this option:

- Fragments will be matched deterministically: A fragment can be written to be on an interface type
  or multiple fragments can be spread for separate union'ed types in a selection set. In many cases,
  if Graphcache doesn't have any schema information then it won't know what possible types a field
  can return and may sometimes make a guess and [issue a
  warning](./errors.md#16-heuristic-fragment-matching). If we pass Graphcache a `schema` then it'll
  be able to match fragments deterministically.
- A schema may have non-default names for its root types; `Query`, `Mutation`, and `Subscription`.
  The names can be changed by passing `schema` information to `cacheExchange` which is important
  if the root type appears elsewhere in the schema, e.g. if the `Query` can be accessed on a
  `Mutation` field's result.
- We may write a lot of configuration for our `cacheExchange` but if we pass a `schema` then it'll
  start checking whether any of the configuration options actually don't exist, maybe because we've
  typo'd them. This is a small detail but can make a large different in a longer configuration.
- Lastly; a schema contains information on **which fields are optional or required**. When
  Graphcache has a schema it knows optional fields that may be left out, and it'll be able to generate
  "partial results".

### Partial Results

As we navigate an app that uses Graphcache we may be in states where some of our data is already
cached while some aren't. Graphcache normalizes data and stores it in tables for links and records for
each entity, which means that sometimes it can maybe even execute a query against its cache that it
hasn't sent to the API before.

[On the "Local Resolvers" page](./local-resolvers.md#resolving-entities) we've seen how to write
resolvers that resolve entities without having to have seen a link from an API result before. If
Graphcache uses these resolvers and previously cached data we often run into situations where a
"partial result" could already be generated, which is what Graphcache does when it has `schema`
information.

![A "partial result" is an incomplete result of information that Graphcache already had cached
before it sent an API result.](../assets/partial-results.png)

Without a `schema` and information on which fields are optional, Graphcache will consider a "partial
result" as a cache miss. If we don't have all the information for a query then we can't execute
it against the locally cached data after all. However, an API's schema contains information on which
fields are required and optional, and if our apps are typed with this schema and
TypeScript, can't we then use and handle these partial results before a request is sent to the API?

This is the idea behind "Schema Awareness" and "Partial Results". When Graphcache has `schema`
information it may give us partial results [with the `stale` flag
set](../api/core.md#operationresult) while it fetches the full result from the API in the
background. This allows our apps to show some information while more is loading.

## Getting your schema

But how do you get an introspected `schema`? The process of introspecting a schema is running an
introspection query on the GraphQL API, which will give us our `IntrospectionQuery` result. So an
introspection is just another query we can run against our GraphQL APIs or schemas.

As long as `introspection` is turned on and permitted, we can download an introspection schema by
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

The `getIntrospectionSchema ` doesn't only accept `IntrospectionQuery` JSON data as inputs, but also
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
