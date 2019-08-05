# Getting Started

## Installation

Installing `urql` is as quick as you'd expect. Firstly, install it
with your package manager of choice:

```sh
yarn add urql
# or
npm install --save urql
```

Then, if you haven't already, make sure that all peer dependencies
are installed as well:

```sh
yarn add react react-dom graphql
# or
npm install --save react react-dom graphql
```

> _Note:_ Most libraries related to GraphQL specify `graphql` as their peer
> dependency so that they can adapt to your specific versioning
> requirements.
> The library is updated frequently and remains very backwards compatible,
> but make sure it will work with other GraphQL tooling you might have installed.

## Writing queries

Like similar libraries that manage state and data, you will need to wrap your
app with `urql`'s `<Provider>`. This `<Provider>` holds the `Client` that is
used to manage data, requests, the cache, and other things. It's the "heart"
of `urql` and holds all of its core logic.

This example creates a `Client`, passes it a GraphQL API's URL, and provides it
using the `<Provider>`.

```jsx
import { Provider, createClient } from 'urql';

const client = createClient({
  url: 'http://localhost:4000/graphql',
});

const YourApp = () => (
  <Provider value={client}>
    {/* ... */}
  </Provider>;
);
```

> A tutorial on how to set up a `client` and `Provider`
> is [available as screencast on egghead](https://egghead.io/lessons/graphql-set-up-an-urql-graphql-provider-in-react?pl=introduction-to-urql-a-react-graphql-client-faaa2bf5).

Every component and query underneath the `<Provider>` in the tree now has access
to the client and will call the client when it needs to execute GraphQL requests.

To illustrate how this works, the next example will use `urql`'s `<Query>`
component to fetch some GraphQL data.

```jsx
import React from 'react';
import { Query } from 'urql';

const getTodos = `
  query GetTodos($limit: Int!) {
    todos(limit: $limit) {
      id
      text
      isDone
    }
  }
`;

const TodoList = ({ limit = 10 }) => {
  <Query query={getTodos} variables={{ limit }}>
    {({ fetching, data, error, extensions }) => {
      if (fetching) {
        return 'Loading...';
      } else if (error) {
        return 'Oh no!';
      }

      return (
        <ul>
          {data.todos.map(({ id, text }) => (
            <li key={id}>{text}</li>
          ))}
        </ul>
      );
    }}
  </Query>;
};
```

When this component is mounted it will send the `query` and `variables`
to your GraphQL API. Here we're using `fetching` to see whether the
request is still being sent and is loading, `error` to see whether any
errors have come back, `data` to get the result, and finally `extensions`
to get any arbitrary extensions data the server may have optionally returned.

Whenever the query or variables props change, the `<Query>` component will
send a new request and go back into the `fetching` state.

The shape of the result include `data` and `error` which is rather similar
to the response a GraphQL API sends back by default. However, the `error`
is not the plural `errors`. `urql` wraps any network error or GraphQL
errors in a `CombinedError` which is more convenient to handle and
observe.

[Read more about the result's API in the Architecture's Results section.](architecture.md#operation-results)

### Using hooks

> _Note:_ Hooks are only available in React 16.8 and onwards

Instead of using `<Query>` and a render prop API, you can also use the
hooks API by switching to `useQuery()`.

We can rewrite the above example as follows.

```jsx
import React from 'react';
import { useQuery } from 'urql';

const getTodos = `
  query GetTodos($limit: Int!) {
    todos(limit: $limit) {
      id
      text
      isDone
    }
  }
`;

const TodoList = ({ limit = 10 }) => {
  const [res] = useQuery({
    query: getTodos,
    variables: { limit },
  });

  if (res.fetching) {
    return 'Loading...';
  } else if (res.error) {
    return 'Oh no!';
  }

  return (
    <ul>
      {res.data.todos.map(({ id, text }) => (
        <li key={id}>{text}</li>
      ))}
    </ul>
  );
};
```

Similarly to the `<Query>` component, `useQuery` will start the request
as soon as it's mounted and will rerun it when the query or variables change.

> A tutorial on the `useQuery` hook is also available as a
> [screencast on egghead](https://egghead.io/lessons/graphql-query-graphql-data-with-urql-using-react-hooks?pl=introduction-to-urql-a-react-graphql-client-faaa2bf5).

[Read more about the result's API in the Architecture's Results section.](architecture.md#operation-results)

### Using `graphql-tag`

You're not limited to just passing in strings as queries. You can also
pass in a fully parsed AST in the form of `DocumentNode` instead.
For this purpose you can use `graphql-tag`.

This can be extremely helpful, since it enables syntax highlighting
in some editors. It also can be used to pre-parse the GraphQL query
using `babel-plugin-graphql-tag` or the included Webpack loader.

You only have to make a small adjustment. Install `graphql-tag` and
you can immediately write tagged template literals instead:

```jsx
import React from 'react';
import gql from 'graphql-tag';
import { Query } from 'urql';

const getTodos = gql`
  query GetTodos($limit: Int!) {
    todos(limit: $limit) {
      id
      text
      isDone
    }
  }
`;

<Query query={getTodos} variables={{ limit }} />;
```

Keep in mind that it makes sense to give your queries unique
names. In this case we've chosen `GetTodos`, since we're simply
listing out some `Todo`s.

[Find out more about `graphql-tag` on their repository.](https://github.com/apollographql/graphql-tag)

## Writing mutations

There always comes a point when an app will also need to send
mutations to the GraphQL API. A mutation's response is very similar
to a query's response, but often they're used in multiple use cases.

Sometimes you care about the response, sometimes you don't, sometimes
it might make more sense to imperatively use the mutations' result.

To support all these use cases `urql`'s `<Mutation>` component
is quite flexible. The render prop API passes down an object that
contains the `executeMutation` method that accepts variables
as its first argument. When called it will return a Promise with
the mutations result.

However, the render prop API will expose the result as well, like
the `<Query>` component exposes it, with a `fetching`, `data`,
and an `error` property.

Here's an example of an imperative use case where we create a todo.

```js
import React, { Component } from 'react';
import { Mutation } from 'urql';

const addTodo = `
  mutation AddTodo($text: String!) {
    addTodo(text: $text) {
      id
      text
    }
  }
`;

class TodoForm extends Component {
  state = {
    error: null,
  };

  add = () => {
    this.props.addTodo({ text: 'something!' }).catch(error => {
      this.setState({ error });
    });
  };

  render() {
    if (this.state.error) {
      return 'Oh no!';
    }

    return <button onClick={this.add}>Add something!</button>;
  }
}

const WithMutation = () => (
  <Mutation query={addTodo}>
    {({ executeMutation }) => <TodoForm addTodo={executeMutation} />}
  </Mutation>
);
```

In this example, when the button is clicked, the component will call
the passed in `executeMutation` method, i.e. the `addTodo` prop.
When an error occurs it changes it states to reflect that in the UI
and it displays an error message.

While this is a common use case, `urql` offers an alternative
approach to this, by using the result directly from the render props.
So let's look at another example.

```js
import React, { Component } from 'react';
import { Mutation } from 'urql';

const addTodo = /* ... */;

class TodoForm extends Component {
  add = () => this.props.addTodo({ text: 'something!' });

  render() {
    if (this.props.error) {
      return 'Oh no!';
    }

    return <button onClick={this.add}>Add something!</button>
  }
}

const WithMutation = () => (
  <Mutation query={addTodo}>
    {({ error, executeMutation }) => <TodoForm error={error} addTodo={executeMutation} />}
  </Mutation>
);
```

This example looks very similar, but as we can see there's sometimes
no need to maintain state to handle a mutation's result, when it's
not used as a fire-and-forget.

### Using hooks

> _Note:_ Hooks are only available in React 16.8 and onwards

Like the `<Query>` component the `<Mutation>` component has an alternative hook
that can be used instead, which is the `useMutation()` hook.

We can rewrite the second example from above as follows.

```jsx
import React, { useCallback } from 'react';
import { useMutation } from 'urql';

const addTodo = `
  mutation AddTodo($text: String!) {
    addTodo(text: $text) {
      id
      text
    }
  }
`;

const TodoForm = () => {
  const [res, executeMutation] = useMutation(addTodo);

  if (res.error) {
    return 'Oh no!';
  }

  return (
    <button onClick={() => executeMutation({ text: 'something!' })}>
      Add something!
    </button>
  );
};
```

This is functionally the same as the second example, but `executeMutation`
also returns a promise with `useMutation` as it does with `<Mutation>` so
the first example could also be written using hooks.

> A tutorial on the `useMutation` hook is also available as a
> [screencast on egghead](https://egghead.io/lessons/graphql-write-a-graphql-mutation-using-react-hooks-with-urql?pl=introduction-to-urql-a-react-graphql-client-faaa2bf5).

## Refetching data

`urql` will by default come with a simple "document" cache. Each query
with variables that is requested from a GraphQL API, the result will be
cached completely. When the same query and variables are requested again,
`urql`'s default cache will then return the cached result. This
result is also invalidated when a mutation with similar `__typename`s was
sent.

[You can find out more about the default caching behavior in the Basics' `cacheExchange` section.](basics.md#cacheexchange)

Using `urql`'s default behavior this means we sometimes need a way to refetch
data from the GraphQL API and skip the cache, if we need fresh data.

The easiest way to always display up-to-date data is to set the `requestPolicy`
to `'cache-and-network'`. Using this policy `urql` will first return a cached
result if it has one, and subsequently it will send a new request to the API
to get the up-to-date result.

A `requestPolicy` can be passed as a prop:

```jsx
<Query query={q} requestPolicy="cache-and-network" />;

/* or with hooks: */

useQuery({ query: q, requestPolicy: 'cache-and-network' });
```

Including `'cache-and-network'` there are four request policies in total:

- `cache-first`: The default policy. It doesn't send a request to the API when a result
  can be retrieved from the cache.
- `cache-only`: It never sends a request and always uses the cached or an empty result.
- `network-only`: This skips the cache entirely and always sends a request.
- `cache-and-network`: As stated above, this returns the cached result and then also
  sends a request to the API.

[You can find out more about how the default cache behaves when it receives these request policies in the Basics' `cacheExchange` section.](basics.md#request-policies)

Next, we can take a look at how to use `'network-only'` to force a refetch
imperatively. In our previous example this would come in handy to refresh the
list of todos.

```jsx
import React from 'react';
import { Query } from 'urql';

const getTodos = `
  query GetTodos {
    todos(limit: 10) {
      id
      text
      isDone
    }
  }
`;

const TodoList = () => {
  <Query query={getTodos}>
    {({ executeQuery, data }) => {
      if (!data) {
        return null;
      }

      return (
        <div>
          <ul>
            {data.todos.map(({ id, text }) => (
              <li key={id}>{text}</li>
            ))}
          </ul>

          <button
            onClick={() => executeQuery({ requestPolicy: 'network-only' })}
          >
            Refresh
          </button>
        </div>
      );
    }}
  </Query>;
};
```

As can be seen, the `<Query>` render props also expose an `executeQuery` method, which
isn't unlike the `<Mutation>` component's `executeMutation` method.

We can call this method to rerun the query and pass it a `requestPolicy` different. In this
case we'll pass `'network-only'` which will skip the cache and make sure we actually refresh
our todo list.

The same example can again also be implemented using hooks:

```jsx
import React from 'react';
import { useQuery } from 'urql';

const getTodos = `
  query GetTodos($limit: Int!) {
    todos(limit: $limit) {
      id
      text
      isDone
    }
  }
`;

const TodoList = ({ limit = 10 }) => {
  const [res, executeQuery] = useQuery({
    query: getTodos,
    variables: { limit }
  });

  if (!res.data) {
    return null;
  }

  return (
    <div>
      <ul>
        {res.data.todos.map(({ id, text }) => (
          <li key={id}>{text}</li>
        ))}
      </ul>

      <button onClick={() => executeQuery({ requestPolicy: 'network-only' })}
        Refresh
      </button>
    </div>
  );
};
```

Which again looks a lot like `useMutation`'s tuple that contains the `executeMutation` function.

## More examples

More examples on how to use `urql`
[can be found in the repository's `examples/` folder](https://github.com/FormidableLabs/urql/tree/master/examples).
