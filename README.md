# urql

Universal React Query Library

[![Build Status](https://travis-ci.org/FormidableLabs/urql.svg?branch=master)](https://travis-ci.org/FormidableLabs/urql) [![Build status](https://ci.appveyor.com/api/projects/status/01arsdnaxm28ogwg?svg=true)](https://ci.appveyor.com/project/kenwheeler/urql)
[![Coverage Status](https://coveralls.io/repos/github/FormidableLabs/urql/badge.svg?branch=master)](https://coveralls.io/github/FormidableLabs/urql?branch=master) [![npm](https://img.shields.io/npm/v/urql.svg)]() [![npm](https://img.shields.io/npm/l/urql.svg)]()

![Urkel](https://images-production.global.ssl.fastly.net/uploads/posts/image/97733/jaleel-white-steve-urkel.jpg)

* [What is `urql`](#what-is-urql)
* [Why this exists](#why-this-exists)
* [How its different](#how-its-different)
* [Install](#install)
* [Getting Started](#getting-started)
* [Cache control](#cache-control)
* [Custom Caches](#custom-caches)
* [API](#api)
  * [Client](#client)
  * [Provider](#provider)
  * [Connect](#connect)
    * [Props](#props)
    * [Render Args](#render-args)
  * [ConnectHOC](#connecthoc)
  * [query](#query)
  * [mutation](#mutation)
  * [CombinedError](#combinederror)
  * [Exchanges](#exchanges)
* [Prior Art](#prior-art)

## What is `urql`

`urql` is a GraphQL client, exposed as a set of ReactJS components.

## Why this exists

In my experience, existing solutions have been a bit heavy on the API side of things, and I see people getting discouraged or turned away from the magic that is GraphQL. This library aims to make GraphQL on the client side as simple as possible.

## How it's different

### React

`urql` is specifically for React. There have been no efforts made to abstract the core in order to work with other libraries. Usage with React was a priority from the get go, and it has been architected as such.

### Render Props

`urql` exposes its API via render props. Recent discussion has shown render props to be an extraordinarily flexible and appropriate API decision for libraries targeting React.

### Caching

`urql` takes a unique approach to caching. Many existing solutions normalize your data and parse your queries to try to invalidate cached data. I am not smart enough to implement this solution, and further, normalizing everything, on big datasets, can potentially lead to performance/memory issues.

`urql` takes a different approach. It takes your query signature and creates a hash, which it uses to cache the results of your query. It also adds `__typename` fields to both queries and mutations, and by default, will invalidate a cached query if it contains a type changed by a mutation. Further, handing control back to the users, it exposes a `shouldInvalidate` prop, which is a function that can be used to determine whether the cache is invalid based upon typenames, mutation response and your current data.

## Install

`npm install urql --save`

## Getting Started

If you want to get right down to business and try a working example of `urql` in action, check out this Code Sandbox:

[https://codesandbox.io/s/p5n69p23x0](https://codesandbox.io/s/p5n69p23x0)

The core of `urql` is three exports, `Provider`, `Connect` and `Client`. To get started, you simply create a `Client` instance, pass it to a `Provider` and then wrap any components you want to make queries or fire mutation from with a `Connect` component. We also provide a `ConnectHOC` higher order component, if you happen to not enjoy the absolutely amazing explicit nature of render props.

Lets look at a root level component and how you can get it set up:

```jsx
import React from 'react';
import ReactDOM from 'react-dom';

import { Provider, Client } from 'urql';
import Home from './home';

const client = new Client({
  url: 'http://localhost:3001/graphql',
});

export const App = () => (
  <Provider client={client}>
    <Home />
  </Provider>
);

ReactDOM.render(<App />, document.getElementById('root'));
```

As you can see above, all that's required to get started is the `url` field on `Client` which tells us where your GraphQL API lives. After the client is created, and passed to the `Provider` that wraps your app, now you can wrap any component down in the tree with a `Connect` to start issuing queries.

Queries and mutations both have creation functions, which you can import. An `urql` `Connect` component can take multiple queries, and multiple mutations. The `render` prop exposes the internal logic to any component you'd like to provide it to.

Lets start by defining a query and a mutation:

```javascript
const TodoQuery = `
query {
  todos {
    id
    text
  }
}
`;
```

## HOLD UP FAM THIS IS IMPORTANT

It is absolutely necessary if you want this library to work properly, to create a valid mutation response. If you change a todo, return it. If you delete a todo, return it. If you add a todo, return it. If you don't return the thing that changed and file an issue, I'm going to screenshot this paragraph, paste it into the issue, and then drop my finger from a 3ft height onto the close button while making plane crash sounds.

```javascript
const AddTodo = `
mutation($text: String!) {
  addTodo(text: $text) {
    id
    text
  }
}
`;
```

Now we can use the `mutation` and `query` functions to format them in the way `urql` expects.

```javascript
const Home = () => (
  <Connect
    query={query(TodoQuery)}
    mutation={{
      addTodo: mutation(AddTodo),
    }}
    children={({ loaded, fetching, refetch, data, error, addTodo }) => {
      //...Your Component
    }}
  />
);
```

You can also use functional child style:

```javascript
const Home = () => (
  <Connect
    query={query(TodoQuery)}
    mutation={{
      addTodo: mutation(AddTodo),
    }}
  >
    {({ loaded, fetching, refetch, data, error, addTodo }) => {
      //...Your Component
    }}
  </Connect>
);
```

The `children` render prop sends a couple of fields back by default:

* `loaded` - This is like `loading` but it's false by default, and becomes true after the first time your query loads. This makes initial loading states easy and reduces flicker on subsequent fetch/refetches.
* `fetching` - This is what you might commonly think of as `loading`. Any time a query or mutation is taking place, this puppy equals true, resolving to false when complete.
* `refetch` - This is a method that you can use to manually refetch your query. You can skip the cache, hit the server and repopulate the cache by calling this like `refetch({ skipCache: true })`.
* `refreshAllFromCache` - This is a method that you can use to manually refetch all queries from the cache.
* `data` - This is where your data lives. Once the query returns, This would look like `{ todos: [...] }`.
* `error` - If there is an error returned when making the query, instead of data, you get this and you can handle it or show a `refetch` button or cry or whatever you wanna do.

Also, any mutations, because they are named, are also passed into this render prop.

As you can see above, the `query` accepts either a single query, or an array of queries. The `mutation` prop accepts an object, with the mutation names as keys.

So why do we use these `query` and `mutation` functions before passing them? Variables, thats why. If you wanted to pass a query with variables, you would construct it like so:

```javascript
import { query } from 'urql';

query(TodoQuery, { myVariable: 5 });
```

Similarly, you can pass variables to your mutation. Mutation, however is a bit different, in the sense that it returns a function that you can call with a variable set:

```javascript
import { mutation } from 'urql';

mutation(AddTodo); // No initial variables

// After you pass 'addTodo' from the render prop to a component:

addTodo({ text: `I'm a variable!` });
```

## Cache control

Normally in `urql`, the cache is aggressively invalidated based upon `__typename`, but if you want finer grained control over your cache, you can use the `shouldInvalidate` prop. It is a function, that returns a boolean, much like `shouldComponentUpdate`, which you can use to determine whether your data needs a refresh from the server. It gets called after every mutation:

```javascript
const MyComponent = () => (
  <Connect
    query={query(MyQuery)}
    shouldInvalidate={(changedTypenames, typenames, mutationResponse, data) => {
      return data.todos.some(d => d.id === mutationResponse.id);
    }}
    children={({ loaded, fetching, refetch, data, error, addTodo }) => {
      //...Your Component
    }}
  />
);
```

The signature of `shouldInvalidate` is basically:

* `changedTypenames` - The typenames returned from the mutation. ex: `['Todo']`
* `typenames` - The typenames that are included in your `Connect` component. ex: `['Todo', 'User', 'Author']`
* `response` - The actual data returned from the mutation. ex: `{ id: 123 }`
* `data` - The data that is local to your `Connect` component as a result of a query. ex: `{ todos: [] }`

Using all or some of these arguments can give you the power to pretty accurately describe whether your connection has now been invalidated.

## Custom Caches

The `Client` constructor accepts a `cache` setting where you can provide your own caching mechanism that will work with `urql`. By default, we use a local object store, but you can provide an adapter for whatever you want.

If you want to supply your own cache, you'll want to provide an object with the following keys:

* `invalidate` - `(hash) => Promise`, invalidates a cache entry.
* `invalidateAll` - `() => Promise`, basically clears the store.
* `read` - `(hash) => Promise`, reads and returns a cache entry
* `update` - `(callback: (store, key, value)) => Promise`, iterates over cache entries and calls the supplied callback function to provide update functionality
* `write` - `(hash, data) => Promise`, writes a value to the store.

Don't worry about the hashes, we convert query objects(query + variables) to the hash behind the scenes. Here is an example of the cache creation function we use internally for reference:

```javascript
const defaultCache = store => {
  return {
    invalidate: hash =>
      new Promise(resolve => {
        delete store[hash];
        resolve();
      }),
    invalidateAll: () =>
      new Promise(resolve => {
        store = {};
        resolve();
      }),
    read: hash =>
      new Promise(resolve => {
        resolve(store[hash] || null);
      }),
    update: callback =>
      new Promise(resolve => {
        if (typeof callback === 'function') {
          Object.keys(store).map(key => {
            callback(store, key, store[key]);
          });
        }
        resolve();
      }),
    write: (hash, data) =>
      new Promise(resolve => {
        store[hash] = data;
        resolve();
      }),
  };
};
```

## API

### Client

#### Options

| Name              | Value                               | Description                                                                                                                                                          |
| ----------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| url               | `string`                            | The URL that the Client should connect to _(required)_                                                                                                               |
| initialCache      | `object`                            | An initial state for your cache if you are using the default cache. This probably won't get much play until SSR is implemented                                       |
| cache             | `ICache`                            | Instance of an `ICache` if you want to build your own custom one built with something like `AsyncStorage`. You can read more about how to create one of these above. |
| fetchOptions      | `object` or `() => object`          | Options provided to the internal `fetch` calls which can either be an object or a function if you want to provide dynamic values like a token header.                |
| transformExchange | `(IExchange, IClient) => IExchange` | A function that receives the default "Exchange" and the client, and returns a new exchange. Use this to customise how the client handles GraphQL requests.           |

#### Description

Client is the constructor for your GraphQL client. It takes a configuration object as an argument, which is required.
You can read more about the individual options above. Please note that providing a `url` property for your GraphQL API endpoint is required.

Example:

```javascript
const client = new Client({ url: 'http://localhost:3000/graphql' });
```

With `transformExchange` you can completely customise how the `urql` client handles a `GraphQL` operation.
Read more about this in the ["Exchanges"](#exchanges) section.

### Provider

Provider is a ReactJS component that is used to provide the `urql` client throughout your application.

Example:

```javascript
const client = new Client({ url: 'http://localhost:3000/graphql' });
//...
return (
  <Provider client={client}>
    <YourApp />
  </Provider>
);
```

### Connect

Connect is a ReactJS component that is used to execute queries and mutations and render child components with the results, using a render prop.

#### Props

| Name             | Value                                                                        | Default    | Description                                                                    |
| ---------------- | ---------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| query            | `QueryObject or [QueryObject]`                                               | `null`     | The query/queries you want connected to your component                         |
| mutation         | `MutationMap`                                                                | `null`     | The mutation/mutations you want connected to your component                    |
| cache            | `boolean`                                                                    | `true`     | Whether this component's queries should be cached                              |
| typeInvalidation | `boolean`                                                                    | `true`     | Whether this component's cache should be invalidated using typeNames           |
| shouldInvalidate | `(changedTypes, componentTypes, mutationResponse, componentData) => boolean` | `null`     | Function used to determine whether the component's cache should be invalidated |
| children         | `({RenderArgs})`                                                             | RenderArgs | Render prop used to render children                                            |

#### Render Args

The following fields are present on the render functions argument object:

| Name                | Value           | Default    | Description                                                                                            |
| ------------------- | --------------- | ---------- | ------------------------------------------------------------------------------------------------------ |
| cache               | `object`        | Cache      | Provides cache operations, defined below                                                               |
| fetching            | `boolean`       | `false`    | Fetching is true during any pending query or mutation operation                                        |
| loaded              | `boolean`       | `false`    | Becomes true once the component gets data for the first time.                                          |
| error               | `CombinedError` | `null`     | Any CombinedErrors thrown during a query or mutation ([see below](#combinederror))                     |
| data                | `object`        | `null`     | Any data returned as the result of a query                                                             |
| refetch             | `function`      | `function` | Function used to refetch existing queries, can skip cache by calling with `{skipCache: true}` argument |
| refreshAllFromCache | `function`      | `function` | Function used to refetch all queries from the cache.                                                   |

The `cache` object provides several helpful cache methods that you can use to control the cache:

* `invalidate` - `invalidate` takes an optional QueryObject parameter, but defaults to invalidating the queries defined on the component.
* `invalidateAll` - Basically clears your entire cache.
* `read` - Takes a QueryObject parameter, returns cache value for that query.
* `update` - Takes a callback function with an argument shape of `(store, key, value)`. The callback function is run against every cache entry, giving you the opportunity to update any given value based upon the context of the current data shape.

In addition to these, any specified mutations are also provided as their key in the mutation map. Mutations are functions that accept an object of variables as an argument and return a `Promise` which resolves to the data the mutation asked for.

Example:

```jsx
<Connect
  query={query(MyQuery)}
  children={({loaded, data}) => {
    return loaded ? <Loading/> : <List data={data.todos}>
  }}
/>

// with mutations

<Connect
  mutation={{
    addTodo: mutation(AddTodo)
  }}
  children={({ addTodo }) => {
    return <button type="button" onClick={addTodo}>Add Todo</button>
  }}
/>
```

### ConnectHOC

_(options: object | (props) => object) => (Component)_

ConnectHOC is a higher order component that essentially does the same thing as the `Connect` component. All of `Connect`'s props except for `render` are valid for the `options` object. Further, you can specify a function, which will provide the component's props and return a dynamic option set. The arguments you'd see in the `render` prop in `Connect` are passed automatically to the wrapped component.

Example:

```javascript
export default ConnectHOC({
  query: query(TodoQuery)
})(MyComponent);

// or

export default ConnectHOC((props) => {
  query: query(TodoQuery, { id: props.id })
})(MyComponent);
```

### query

_(query: string, variables?: object) => {query: string, variables: object}_

`query` is a QueryObject creator.

Example:

```javascript
query(
  `
query($id: ID!) {
  todos(id: $id) {
    text
  }
}`,
  { id: 5 }
);
```

### mutation

_(query: string, variables?: object) => {query: string, variables: object}_

`query` is a MutationObject creator.

Example:

```javascript
mutation(
  `
mutation($id: ID!) {
  addTodo(id: $id) {
    text
  }
}`,
  { id: 5 }
);
```

### CombinedError

CombinedError displays a list of all network and GraphQL errors that have occured during a GraphQL request.

_No GraphQL errors will be present if a network error has occured_

The following fields are present within a CombinedError:

| Name          | Value         | Description                          |
| ------------- | ------------- | ------------------------------------ |
| networkError  | Error         | Network error if fetch has failed    |
| graphQLErrors | Error[]       | GraphQL errors from the API response |
| reponse       | FetchResponse | Raw Response instance                |

### Exchanges

An **“Exchange”** is a function that accepts an operation and returns an observable with
the GraphQL query’s result. Any operation, like queries or mutations, flow through the exchange
and are processed by it.

The most important exchange is the `httpExchange`. It sends operations to your API and returns
an observable with the actual result. `urql` comes with two more exchanges by default:

* `dedupExchange`: Takes an exchange and returns a new one that deduplicates in-flight requests
* `cacheExchange`: Reads query-operations from the cache and writes results to the cache

By default urql will create a default exchange using all three, which looks like this:

```javascript
let exchange;
exchange = httpExchange();
exchange = dedupExchange(exchange);
exchange = cacheExchange(this.cache, exchange);
```

This means that by default `urql` will try to resolve queries from the cache (if `skipCache` is `false`),
then deduplicate in-flight requests that have the same query and variables, and then send the
operations that come through to your API endpoint. Lastly the result for queries will be written
to the cache.

You can write your own exchanges if you wish to customise this behaviour. The [client](#client)
accepts the `transformExchange` function. This function receives the default exchange, as described
above. So if you'd like to wrap the default exchange and do something custom, you can, or if you'd like
to replace the default exchange you can just return an entirely different exchange.

The **“Operations”** that an exchange receives have the following properties:

| Name          | Value     | Description                                              |
| ------------- | --------- | -------------------------------------------------------- |
| key           | `string`  | The cache key of an operation (query + variables hashed) |
| query         | `string`  | The GraphQL query string                                 |
| variables     | `?object` | Variables for the GraphQL query                          |
| operationName | `string`  | The operation’s name, `query` or `mutation`              |
| context       | `object`  | A dictionary of options                                  |

The `context` property can be used for any data, but the `httpExchange` in particular uses it to
receive the `url` and `fetchOptions`, and the `cacheExchange` uses it to receive the `skipCache`
flag.

The result that an exchange emits in an observable is like GraphQL’s `ExecutionResult`. It carries
the `data` property, the `error` property that can be a [`CombinedError`](#combinederror), and
the `typeNames` property, which tells `urql` which parts of the cache to invalidate.

If you'd like to write your own exchange you could approach it like so:

```javascript
import Observable from 'zen-observable-ts';

const funExchange = forward => operation =>
  new Observable(observer => {
    const subscription = forward(operation).subscribe({
      next: result => {
        result.fun = true;
        observer.next(fun);
      },
      error: e => observer.error(e),
      complete: () => observer.complete(),
    });

    return () => subscription.unsubscribe();
  });

const client = new Client({
  url: 'http://localhost:3000/graphql',
  transformExchange: (exchange, _client) => funExchange(exchange),
});
```

### use urql without using components

While the goal of this project is to work nicely with react, sometimes you just need to do a mutation or a query without using any components. In this case you can call [client.executeQuery](src/components/client.tsx#L188) directly.

Example:

```javascript
let variables = { q: 'Did I do that?' };
let skipCache = true; //set this to true if you don't need cache
client.executeQuery(query(myQuery, variables), skipCache).then(function(data) {
  console.log(data);
});
```

## TODO

* [ ] Server Side Rendering
* [ ] Client Side Resolvers
* [ ] Cache update reactivity
* [ ] Prefix all errors with "Did I do that?"

## Prior Art

### Apollo

This library wouldn't be possible without [Apollo](https://www.apollographql.com/). Apollo was what made GraphQL click for me. I need to give big shout outs to folks like [@stubailo](https://github.com/stubailo), [@jbaxleyiii](https://github.com/jbaxleyiii) and [@peggyrayzis](https://github.com/peggyrayzis), without whom I wouldn't even know GraphQL. Enormous amounts of inspiration for this lib came from Apollo and its architecture.
