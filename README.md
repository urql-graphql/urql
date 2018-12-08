# urql

Universal React Query Library

[![Build Status](https://travis-ci.org/FormidableLabs/urql.svg?branch=master)](https://travis-ci.org/FormidableLabs/urql) [![Build status](https://ci.appveyor.com/api/projects/status/01arsdnaxm28ogwg?svg=true)](https://ci.appveyor.com/project/kenwheeler/urql)
[![Coverage Status](https://coveralls.io/repos/github/FormidableLabs/urql/badge.svg?branch=master)](https://coveralls.io/github/FormidableLabs/urql?branch=master) [![npm](https://img.shields.io/npm/v/urql.svg)]() [![npm](https://img.shields.io/npm/l/urql.svg)]()

![Urkel](https://images-production.global.ssl.fastly.net/uploads/posts/image/97733/jaleel-white-steve-urkel.jpg)

- [What is `urql`](#what-is-urql)
- [Why this exists](#why-this-exists)
- [How its different](#how-its-different)
- [Install](#install)
- [Getting Started](#getting-started)
- [Cache control](#cache-control)
- [Custom Caches](#custom-caches)
- [API](#api)
  - [Client](#client)
  - [Provider](#provider)
  - [Connect](#connect)
    - [Props](#props)
    - [Render Args](#render-args)
  - [ConnectHOC](#connecthoc)
  - [createQuery](#createQuery)
  - [createMutation](#createMutation)
  - [CombinedError](#combinederror)
  - [Exchanges](#exchanges)
- [Prior Art](#prior-art)

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

import { Provider, createClient } from 'urql';
import Home from './home';

const client = createClient({
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
    query={createQuery(TodoQuery)}
    mutations={{
      addTodo: createMutation(AddTodo),
    }}
    children={({ fetching, error, data, mutations, refetch }) => {
      //...Your Component
    }}
  />
);
```

You can also use functional child style:

```javascript
const Home = () => (
  <Connect
    query={createQuery(TodoQuery)}
    mutations={{
      addTodo: createMutation(AddTodo),
    }}
  >
    {({ fetching, error, data, mutations, refetch }) => {
      //...Your Component
    }}
  </Connect>
);
```

As you can see above, the `query` accepts a query while the `mutations` prop accepts an object, with the mutation names as keys.

The `children` render prop sends a couple of fields back by default:

- `fetching` - This is what you might commonly think of as `loading`. Any time a query or mutation is taking place, this puppy equals true, resolving to false when complete.
- `error` - If there is an error returned when making the query, instead of data, you get this and you can handle it or show a `refetch` button or cry or whatever you wanna do.
- `data` - This is where your data lives. Once the query returns, This would look like `{ todos: [...] }`.
- `mutations` - This is a collection of functions for triggering a mutation, each key matching the mutations you just provided to the _Connect_ component. To call the _addTodo_ mutation with variables, you would do `mutations.addTodo(myVars)`.
- `refetch` - This is a method that you can use to manually refetch your query. You can skip the cache, hit the server and repopulate the cache by calling this like `refetch(true)`.

So why do we use these `createQuery` and `createMutation` functions before passing them? Variables, that's why. If you wanted to pass a query with variables, you would construct it like so:

```javascript
import { createQuery } from 'urql';

createQuery(TodoQuery, { myVariable: 5 });
```

Similarly, you can pass variables to your mutation. Mutation, however is a bit different, in the sense that it returns a function that you can call with a variable set:

```javascript
import { createMutation } from 'urql';

createMutation(AddTodo); // No initial variables

// After you pass 'addTodo' from the render prop to a component:

mutations.addTodo({ text: `I'm a variable!` });
```

## TODO

- [ ] Server Side Rendering
- [ ] Client Side Resolvers
- [ ] Cache update reactivity
- [ ] Prefix all errors with "Did I do that?"

## Prior Art

### Apollo

This library wouldn't be possible without [Apollo](https://www.apollographql.com/). Apollo was what made GraphQL click for me. I need to give big shout outs to folks like [@stubailo](https://github.com/stubailo), [@jbaxleyiii](https://github.com/jbaxleyiii) and [@peggyrayzis](https://github.com/peggyrayzis), without whom I wouldn't even know GraphQL. Enormous amounts of inspiration for this lib came from Apollo and its architecture.
