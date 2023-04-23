---
title: Vue Bindings
order: 1
---

# Vue

## Getting started

The `@urql/vue` bindings have been written with [Vue
3](https://github.com/vuejs/vue-next/releases/tag/v3.0.0) in mind and use Vue's newer [Composition
API](https://v3.vuejs.org/guide/composition-api-introduction.html). This gives the `@urql/vue`
bindings capabilities to be more easily integrated into your existing `setup()` functions.

### Installation

Installing `@urql/vue` is quick and no other packages are immediately necessary.

```sh
yarn add @urql/vue graphql
# or
npm install --save @urql/vue graphql
```

Most libraries related to GraphQL also need the `graphql` package to be installed as a peer
dependency, so that they can adapt to your specific versioning requirements. That's why we'll need
to install `graphql` alongside `@urql/vue`.

Both the `@urql/vue` and `graphql` packages follow [semantic versioning](https://semver.org) and
all `@urql/vue` packages will define a range of compatible versions of `graphql`. Watch out
for breaking changes in the future however, in which case your package manager may warn you about
`graphql` being out of the defined peer dependency range.

### Setting up the `Client`

The `@urql/vue` package exports a `Client` class, which we can use to create
the GraphQL client. This central `Client` manages all of our GraphQL requests and results.

```js
import { Client, cacheExchange, fetchExchange } from '@urql/vue';

const client = new Client({
  url: 'http://localhost:3000/graphql',
  exchanges: [cacheExchange, fetchExchange],
});
```

At the bare minimum we'll need to pass an API's `url` and `exchanges` when we create a `Client`
to get started.

Another common option is `fetchOptions`. This option allows us to customize the options that will be
passed to `fetch` when a request is sent to the given API `url`. We may pass in an options object or
a function returning an options object.

In the following example we'll add a token to each `fetch` request that our `Client` sends to our
GraphQL API.

```js
const client = new Client({
  url: 'http://localhost:3000/graphql',
  exchanges: [cacheExchange, fetchExchange],
  fetchOptions: () => {
    const token = getToken();
    return {
      headers: { authorization: token ? `Bearer ${token}` : '' },
    };
  },
});
```

### Providing the `Client`

To make use of the `Client` in Vue we will have to provide from a parent component to its child
components. This will share one `Client` with the rest of our app. In `@urql/vue` there are two
different ways to achieve this.

The first method is to use `@urql/vue`'s `provideClient` function. This must be called in any of
your parent components and accepts either a `Client` directly or just the options that you'd pass to
`Client`.

```html
<script>
  import { Client, provideClient, cacheExchange, fetchExchange } from '@urql/vue';

  const client = new Client({
    url: 'http://localhost:3000/graphql',
    exchanges: [cacheExchange, fetchExchange],
  });

  provideClient(client);
</script>
```

Alternatively we may use the exported `install` function and treat `@urql/vue` as a plugin by
importing its default export and using it [as a plugin](https://v3.vuejs.org/guide/plugins.html#using-a-plugin).

```js
import { createApp } from 'vue';
import Root from './App.vue';
import urql, { cacheExchange, fetchExchange } from '@urql/vue';

const app = createApp(Root);

app.use(urql, {
  url: 'http://localhost:3000/graphql',
  exchanges: [urql.cacheExchange, fetchExchange]
});

app.mount('#app');
```

The plugin also accepts `Client`'s options or a `Client` as its inputs.

## Queries

We'll implement queries using the `useQuery` function from `@urql/vue`.

### Run a first query

For the following examples, we'll imagine that we're querying data from a GraphQL API that contains
todo items. Let's dive right into it!

```jsx
<template>
  <div v-if="fetching">
    Loading...
  </div>
  <div v-else-if="error">
    Oh no... {{error}}
  </div>
  <div v-else>
    <ul v-if="data">
      <li v-for="todo in data.todos" :key="todo.id">{{ todo.title }}</li>
    </ul>
  </div>
</template>

<script>
import { gql, useQuery } from '@urql/vue';

export default {
  setup() {
    const result = useQuery({
      query: gql`
        {
          todos {
            id
            title
          }
        }
      `
    });

    return {
      fetching: result.fetching,
      data: result.data,
      error: result.error,
    };
  }
};
</script>
```

Here we have implemented our first GraphQL query to fetch todos. We see that `useQuery` accepts
options and returns a result object. In this case we've set the `query` option to our GraphQL query.

The result object contains several properties. The `fetching` field indicates whether we're currently
loading data, `data` contains the actual `data` from the API's result, and `error` is set when either
the request to the API has failed or when our API result contained some `GraphQLError`s, which
we'll get into later on the ["Errors" page](./errors.md).

All of these properties on the result are derived from the [shape of
`OperationResult`](../api/core.md#operationresult) and are marked as [reactive
](https://v3.vuejs.org/guide/reactivity-fundamentals.html), which means they may
update while the query is running, which will automatically update your UI.

### Variables

Typically we'll also need to pass variables to our queries, for instance, if we are dealing with
pagination. For this purpose `useQuery` also accepts a `variables` input, which we can
use to supply variables to our query.

```jsx
<template>
  ...
</template>

<script>
import { gql, useQuery } from '@urql/vue';

export default {
  props: ['from', 'limit'],
  setup({ from, limit }) {
    return useQuery({
      query: gql`
        query ($from: Int!, $limit: Int!) {
          todos(from: $from, limit: $limit) {
            id
            title
          }
        }
      `,
      variables: { from, limit }
    });
  }
};
</script>
```

As when we're sending GraphQL queries manually using `fetch`, the variables will be attached to the
`POST` request body that is sent to our GraphQL API.

All inputs that are passed to `useQuery` may also be [reactive
state](https://v3.vuejs.org/guide/reactivity-fundamentals.html). This means that both the inputs and
outputs of `useQuery` are reactive and may change over time.

```jsx
<template>
  <ul v-if="data">
    <li v-for="todo in data.todos" :key="todo.id">{{ todo.title }}</li>
  </ul>
  <button @click="from += 10">Next Page</button>
</template>

<script>
import { gql, useQuery } from '@urql/vue';

export default {
  setup() {
    const from = ref(0);

    const result = useQuery({
      query: gql`
        query ($from: Int!, $limit: Int!) {
          todos(from: $from, limit: $limit) {
            id
            title
          }
        }
      `,
      variables: { from, limit: 10 }
    });

    return {
      from,
      data: result.data,
    };
  }
};
</script>
```

### Pausing `useQuery`

In some cases we may want `useQuery` to execute a query when a pre-condition has been met, and not
execute the query otherwise. For instance, we may be building a form and want a validation query to
only take place when a field has been filled out.

Since with Vue 3's Composition API we won't just conditionally call `useQuery` we can instead pass a
reactive `pause` input to `useQuery`.

In the previous example we've defined a query with mandatory arguments. The `$from` and `$limit`
variables have been defined to be non-nullable `Int!` values.

Let's pause the query we've just written to not execute when these variables are empty, to
prevent `null` variables from being executed. We can do this by computing `pause` to become `true`
whenever these variables are falsy:

```js
import { reactive } from 'vue'
import { gql, useQuery } from '@urql/vue';

export default {
  props: ['from', 'limit'],
  setup({ from, limit }) {
    const shouldPause = computed(() => from == null || limit == null);
    return useQuery({
      query: gql`
        query ($from: Int!, $limit: Int!) {
          todos(from: $from, limit: $limit) {
            id
            title
          }
        }
      `,
      variables: { from, limit },
      pause: shouldPause
    });
  }
};
</script>
```

Now whenever the mandatory `$from` or `$limit` variables aren't supplied the query won't be executed.
This also means that `result.data` won't change, which means we'll still have access to our old data
even though the variables may have changed.

It's worth noting that depending on whether `from` and `limit` are reactive or not you may have to
change how `pause` is computed. But there's also an imperative alternative to this API. Not only
does the result you get back from `useQuery` have an `isPaused` ref, it also has `pause()` and
`resume()` methods.

```jsx
<template>
  <div v-if="fetching">
    Loading...
  </div>
  <button @click="isPaused ? resume() : pause()">Toggle Query</button>
</template>

<script>
import { gql, useQuery } from '@urql/vue';

export default {
  setup() {
    return useQuery({
      query: gql`
        {
          todos {
            id
            title
          }
        }
      `
    });
  }
};
</script>
```

This means that no matter whether you're in or outside of `setup()` or rather supplying the inputs
to `useQuery` or using the outputs, you'll have access to ways to pause or unpause the query.

### Request Policies

As has become clear in the previous sections of this page, the `useQuery` hook accepts more options
than just `query` and `variables`. Another option we should touch on is `requestPolicy`.

The `requestPolicy` option determines how results are retrieved from our `Client`'s cache. By
default this is set to `cache-first`, which means that we prefer to get results from our cache, but
are falling back to sending an API request.

Request policies aren't specific to `urql`'s Vue bindings, but are a common feature in its core.
[You can learn more about how the cache behaves given the four different policies on the "Document
Caching" page.](../basics/document-caching.md)

```js
import { useQuery } from '@urql/vue';

export default {
  setup() {
    return useQuery({
      query: TodosQuery,
      requestPolicy: 'cache-and-network',
    });
  },
};
```

Specifically, a new request policy may be passed directly to `useQuery` as an option.
This policy is then used for this specific query. In this case, `cache-and-network` is used and
the query will be refreshed from our API even after our cache has given us a cached result.

Internally, the `requestPolicy` is just one of several "**context** options". The `context`
provides metadata apart from the usual `query` and `variables` we may pass. This means that
we may also change the `Client`'s default `requestPolicy` by passing it there.

```js
import { Client, cacheExchange, fetchExchange } from '@urql/vue';

const client = new Client({
  url: 'http://localhost:3000/graphql',
  exchanges: [cacheExchange, fetchExchange],
  // every operation will by default use cache-and-network rather
  // than cache-first now:
  requestPolicy: 'cache-and-network',
});
```

### Context Options

As mentioned, the `requestPolicy` option on `useQuery` is a part of `urql`'s context options.
In fact, there are several more built-in context options, and the `requestPolicy` option is
one of them. Another option we've already seen is the `url` option, which determines our
API's URL. These options aren't limited to the `Client` and may also be passed per query.

```jsx
import { useQuery } from '@urql/vue';

export default {
  setup() {
    return useQuery({
      query: TodosQuery,
      context: {
        requestPolicy: 'cache-and-network',
        url: 'http://localhost:3000/graphql?debug=true',
      },
    });
  },
};
```

As we can see, the `context` property for `useQuery` accepts any known `context` option and can be
used to alter them per query rather than globally. The `Client` accepts a subset of `context`
options, while the `useQuery` option does the same for a single query.
[You can find a list of all `Context` options in the API docs.](../api/core.md#operationcontext)

### Reexecuting Queries

The `useQuery` hook updates and executes queries whenever its inputs, like the `query` or
`variables` change, but in some cases we may find that we need to programmatically trigger a new
query. This is the purpose of the `executeQuery` method which is a method on the result object
that `useQuery` returns.

Triggering a query programmatically may be useful in a couple of cases. It can for instance be used
to refresh data that is currently being displayed. In these cases we may also override the
`requestPolicy` of our query just once and set it to `network-only` to skip the cache.

```js
import { gql, useQuery } from '@urql/vue';

export default {
  setup() {
    const result = useQuery({
      query: gql`
        {
          todos {
            id
            title
          }
        }
      `,
    });

    return {
      data: result.data,
      fetching: result.fetching,
      error: result.error,
      refresh() {
        result.executeQuery({
          requestPolicy: 'network-only',
        });
      },
    };
  },
};
```

Calling `refresh` in the above example will execute the query again forcefully, and will skip the
cache, since we're passing `requestPolicy: 'network-only'`.

Furthermore the `executeQuery` function can also be used to programmatically start a query even
when `pause` is set to `true`, which would usually stop all automatic queries. This can be used to
perform one-off actions, or to set up polling.

### Vue Suspense

In Vue 3 a [new feature was introduced](https://vuedose.tips/go-async-in-vue-3-with-suspense/) that
natively allows components to suspend while data is loading, which works universally on the server
and on the client, where a replacement loading template is rendered on a parent while data is
loading.

Any component's `setup()` function can be updated to instead be an `async setup()` function, in
other words, to return a `Promise` instead of directly returning its data. This means that we can
update any `setup()` function to make use of Suspense.

The `useQuery`'s returned result supports this, since it is a `PromiseLike`. We can update one of
our examples to have a suspending component by changing our usage of `useQuery`:

```jsx
<template>
  <ul>
    <li v-for="todo in data.todos" :key="todo.id">{{ todo.title }}</li>
  </ul>
</template>

<script>
import { gql, useQuery } from '@urql/vue';

export default {
  async setup() {
    const { data, error } = await useQuery({
      query: gql`
        {
          todos {
            id
            title
          }
        }
      `
    });

    return { data };
  }
};
</script>
```

As we can see, `await useQuery(...)` here suspends the component and what we render will not have to
handle the loading states of `useQuery` at all. Instead in Vue Suspense we'll have to wrap a parent
component in a "Suspense boundary." This boundary is what switches a parent to a loading state while
parts of its children are fetching data. The suspense promise is in essence "bubbling up" until it
finds a "Suspense boundary".

```
<template>
 <Suspense>
   <template #default>
     <MyAsyncComponent />
   </template>
   <template #fallback>
     <span>Loading...</span>
   </template>
 </Suspense>
</template>
```

As long as any parent component is wrapping our component which uses `async setup()` in this
boundary, we'll get Vue Suspense to work correctly and trigger this loading state. When a child
suspends this component will switch to using its `#fallback` template rather than its `#default`
template.

### Chaining calls in Vue Suspense

As shown [above](#vue-suspense), in Vue Suspense the `async setup()` lifecycle function can be used
to set up queries in advance, wait for them to have fetched some data, and then let the component
render as usual.

However, because the `async setup()` function can be used with `await`-ed promise calls, we may run
into situations where we're trying to call functions like `useQuery()` after we've already awaited
another promise and will be outside of the synchronous scope of the `setup()` lifecycle. This means
that the `useQuery` (and `useSubscription` & `useMutation`) functions won't have access to the
`Client` anymore that we'd have set up using `provideClient`.

To prevent this, we can create something called a "client handle" using the `useClientHandle`
function.

```js
import { gql, useClientHandle } from '@urql/vue';

export default {
  async setup() {
    const handle = useClientHandle();

    await Promise.resolve(); // NOTE: This could be any await call

    const result = await handle.useQuery({
      query: gql`
        {
          todos {
            id
            title
          }
        }
      `,
    });

    return { data: result.data };
  },
};
```

As we can see, when we use `handle.useQuery()` we're able to still create query results although we've
interrupted the synchronous `setup()` lifecycle with a `Promise.resolve()` delay. This would also
allow us to create chained queries by using
[`computed`](https://v3.vuejs.org/guide/reactivity-computed-watchers.html#computed-values) to use an
output from a preceding result in a next `handle.useQuery()` call.

### Reading on

There are some more tricks we can use with `useQuery`. [Read more about its API in the API docs for
it.](../api/vue.md#usequery)

## Mutations

The `useMutation` function is similar to `useQuery` but is triggered manually and accepts
only a `DocumentNode` or `string` as an input.

### Sending a mutation

Let's again pick up an example with an imaginary GraphQL API for todo items, and dive into an
example! We'll set up a mutation that _updates_ a todo item's title.

```js
import { gql, useMutation } from '@urql/vue';

export default {
  setup() {
    const { executeMutation: updateTodo } = useMutation(gql`
      mutation($id: ID!, $title: String!) {
        updateTodo(id: $id, title: $title) {
          id
          title
        }
      }
    `);

    return { updateTodo };
  },
};
```

Similar to the `useQuery` output, `useMutation` returns a result object, which reflects the data of
an executed mutation. That means it'll contain the familiar `fetching`, `error`, and `data`
properties — it's identical since this is a common pattern of how `urql`
presents [operation results](../api/core.md#operationresult).

Unlike the `useQuery` hook, the `useMutation` hook doesn't execute automatically. At this point in
our example, no mutation will be performed. To execute our mutation we instead have to call the
`executeMutation` method on the result with some variables.

### Using the mutation result

When calling our `updateTodo` function we have two ways of getting to the result as it comes back
from our API. We can either use the result itself, since all properties related to the last
[operation result](../api/core.md#operationresult) are marked as [reactive
](https://v3.vuejs.org/guide/reactivity-fundamentals.html) — or we can use the promise that the
`executeMutation` method returns when it's called:

```js
import { gql, useMutation } from '@urql/vue';

export default {
  setup() {
    const updateTodoResult = useMutation(gql`
      mutation($id: ID!, $title: String!) {
        updateTodo(id: $id, title: $title) {
          id
          title
        }
      }
    `);

    return {
      updateTodo(id, title) {
        const variables = { id, title: title || '' };
        updateTodoResult.executeMutation(variables).then(result => {
          // The result is almost identical to `updateTodoResult` with the exception
          // of `result.fetching` not being set and its properties not being reactive.
          // It is an OperationResult.
        });
      },
    };
  },
};
```

The reactive result that `useMutation` returns is useful when your UI has to display progress or
results on the mutation, and the returned promise is particularly useful when you're adding
side-effects that run after the mutation has completed.

### Handling mutation errors

It's worth noting that the promise we receive when calling the execute function will never
reject. Instead it will always return a promise that resolves to a result.

If you're checking for errors, you should use `result.error` instead, which will be set
to a `CombinedError` when any kind of errors occurred while executing your mutation.
[Read more about errors on our "Errors" page.](./errors.md)

```js
import { gql, useMutation } from '@urql/vue';

export default {
  setup() {
    const updateTodoResult = useMutation(gql`
      mutation($id: ID!, $title: String!) {
        updateTodo(id: $id, title: $title) {
          id
          title
        }
      }
    `);

    return {
      updateTodo(id, title) {
        const variables = { id, title: title || '' };
        updateTodoResult.executeMutation(variables).then(result => {
          if (result.error) {
            console.error('Oh no!', result.error);
          }
        });
      },
    };
  },
};
```

There are some more tricks we can use with `useMutation`.<br />
[Read more about its API in the API docs for it.](../api/vue.md#usemutation)

## Reading on

This concludes the introduction for using `urql` with Vue. The rest of the documentation
is mostly framework-agnostic and will apply to either `urql` in general or the `@urql/core` package,
which is the same between all framework bindings. Hence, next we may want to learn more about one of
the following to learn more about the internals:

- [How does the default "document cache" work?](./document-caching.md)
- [How are errors handled and represented?](./errors.md)
- [A quick overview of `urql`'s architecture and structure.](../architecture.md)
- [Setting up other features, like authentication, uploads, or persisted queries.](../advanced/README.md)
