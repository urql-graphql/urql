---
title: urql outside of react
order: 5
---

<a name="urql-outside-of-react"></a>

# urql Outside of React

While `urql` is a GraphQL client that's mainly targeting React, apart from our React-specific APIs (i.e. the hooks and components), all other elements of the library function the same outside of a React context. In this guide, we'll take a look at using `urql` in environments other than React, including NodeJS and Vue.

The most useful element for using `urql` outside of React is the `Client`, the library's central orchestrator. The `Client` handles all outgoing requests and incoming responses in `urql`, and comes along with a variety of methods to help you orchestrate communication with your GraphQL API. The most useful of these are the `execute*` methods (`executeQuery`, `executeMutation`, and `executeSubscription`).

The `execute*` methods all accept an instance of a `GraphQLRequest`, which can be created by using `urql`'s `createRequest` function. `createRequest` will create a unique hash used to identify the GraphQL operation, which is used internally to track it for things like deduplication and caching.

```javascript
// load dependencies
require('isomorphic-fetch');
const { createClient, createRequest } = require('urql/client');
const gql = require('graphql-tag');

// create the urql Client
const client = createClient({
  url: 'https://graphbrainz.herokuapp.com/graphql',
});

// define your GraphQL query
const query = gql`
  query SearchArtist($search: String!) {
    search {
      artists(query: $search, first: 1) {
        edges {
          node {
            name
            country
            releases(first: 10) {
              edges {
                node {
                  title
                  date
                  media {
                    format
                    trackCount
                    tracks {
                      title
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

// create the urql request object
const request = createRequest(query, { search: 'Courtney Barnett' });
```

Once you've created your request, all that's left is to execute it! When you execute a query, mutation, or subscription, `urql` returns you [a `wonka` Source](https://wonka.kitten.sh/api/sources) containing the `data` and `error` states of that request. You can use [`wonka`'s Sinks](https://wonka.kitten.sh/api/sinks) to access these like so:

```javascript
const { pipe, subscribe } = require('wonka');

pipe(
  client.executeQuery(request),
  subscribe(({ data, error }) => {
    if (error) {
      console.log('Error', error);
    }

    console.log('Data', data);
  })
);
```

Awesome, we've successfully executed a GraphQL query on the server in NodeJS! In practice, this is more useful for writing small Node scripts or a simple CLI for interacting with a GraphQL API. But it does show off the flexibility that `urql`'s `Client` gives us!

See the full CodeSandbox example [here](https://codesandbox.io/s/urql-node-1jhj8).

## Doing More with the Client

The `Client` comes with more methods than just the `execute*` methods. While the use cases for these additional methods are fairly specific to `urql`'s implementation, they do give you more direct control over the `Client`. Let's say, for example, that you want to reexecute an operation on a predefined interval (a form of long polling). This is fairly trivial to do by calling `Client.reexecuteOperation` with the request's `Operation` object. To create the `Operation` object, use `Client.createOperation`, passing the operation type as the first argument (`"query"`, `"mutation"`, `"subscription"`, or `"teardown"`).

```javascript
require('isomorphic-fetch');
const { createClient, createRequest } = require('urql/client');
const gql = require('graphql-tag');
const { pipe, subscribe, interval, take } = require('wonka');

const client = createClient({
  url: 'https://graphbrainz.herokuapp.com/graphql',
});

const query = gql`
  query SearchArtist($search: String!) {
    search {
      artists(query: $search, first: 1) {
        edges {
          node {
            name
            country
            releases(first: 10) {
              edges {
                node {
                  title
                  date
                  media {
                    format
                    trackCount
                    tracks {
                      title
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

const request = createRequest(query, { search: 'Courtney Barnett' });

pipe(
  client.executeQuery(request),
  subscribe(({ data, error }) => {
    if (error) {
      console.log('Error', error);
    }

    console.log('Data', data);
  })
);

pipe(
  interval(2000),
  take(10),
  subscribe(n => {
    // Call client.createRequest operation to create the Operation object.
    // The optional third argument is a partial operation context, which allows you
    // to change the operation's request policy or fetch options.
    const operation = client.createRequestOperation('query', request, {
      requestPolicy: 'network-only',
    });

    // Reexecute the operation. Active subscribers will receive updates.
    client.reexecuteOperation(operation);
  })
);
```

Awesome, we've got basic long polling working, where our `Client` is reexecuting the initial request every 2 seconds. By passing `{ requestPolicy: 'network-only' }` as the third argument to `reexecuteOperation`, we ensure that the `Client` issues a new request to the GraphQL API every time rather than pulling results from the cache. You'll notice in this example we use `wonka`'s `take` operator to limit the number of times we call `reexecuteOperation` – in true long polling, you wouldn't do this.

See the full CodeSanbox example [here](https://codesandbox.io/s/urql-node-polling-erkwe).
