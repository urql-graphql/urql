# Getting started

## Installation

Installing the graphCache is very simple:

```bash
yarn add @urql/exchange-graphcache
# or
npm i --save @urql/exchange-graphcache
```

Now that we have the exchnage in our dependencies
let's include it in our client.

```js
import { createClient, dedupExchange, fetchExchange } from 'urql';
import { cacheExchange } from '@urql/exchange-graphcache';

const client = createClient({
  exchanges: [dedupExchange, cacheExchange(), fetchExchange]
  url: '<insert your url>',
})
```

You see us invoking the cacheExchange, this is because
it's a higher order function. We'll use this later on
to pass in different options.

## Options

The options you can pass into the function.

### Resolvers

This is a way to alter the response you'll get from the cache,
so let's look at an example to get a better understanding.

```js
const cache = cacheExchange({
  resolvers: {
    Todo: { text: () => 'Secret' },
  },
});
```

Now when we query our `todos` we always encounter `Todo` since
this is the `__typename` of every single todo in the array of todos.
This in turn passes `text` when we query it and will see that we don't
want the original result but something else so your resolver will be
executed.

This looks pretty useless right now but let's look at what arguments
are passed to this method to better understand it.

A resolver gets four arguments:

- parent: in this case the result of the `Todo` up until us getting `text`
- arguments: the arguments used in this field.
- cache: this is the normalised cache, this cache provides us with a `resolve` method
  more about this underneath.
- info: contains the fragments used in the query and the variables in the query.

The `cache.resolve` method is used to get links and property values from the cache,
our cache methods has three arguments:

- entity: this can either be an object containing a `__typename` and an `id` or `_id`.
  This argument however can also be a string, this will be a key leading to a cached entity.
- field: the field you want data for, this can be a relation or a single property.
- arguments: the arguments to include on the field.

To get a better grasp let's look at a few examples.
Consider the following data structure:

```js
todos: [
  {
    id: '1',
    text: 'Install urql',
    complete: true,
    author: { id: '2', name: 'Bar' },
  },
  {
    id: '2',
    text: 'Learn urql',
    complete: true,
    author: { id: '1', name: 'Foo' },
  },
];
```

When we would use `resolve` to get the author it would look like this:

```js
const parent = {
  id: '1',
  text: 'Install urql',
  complete: true,
  author: undefined,
  __typename: 'Todo',
};
const result = cache.resolve(parent, 'author');
console.log(result); // 'Author:2'
```

Now we have a stringed key that indicates our author, now we
can use this to derive the name of our author.

```js
const name = cache.resolve('Author:2', 'name');
console.log(name); // 'Bar'
```

This can solve practical use cases like for example date formatting,
you can query the date and then convert it in your resolver.

### updates

When the cache receives a response it will try and do its best to
incorporate that answer into the current cache, but for adding and
deleting entities it can't really make assumptions.

That's where updates come into play, this being the third argument
to our cacheExchange. Analogue to our `resolvers` this gets
arguments but instead of the parent argument (first one) we get the
result of our mutation.

Before we dive into the code we need to know about two additional methods
the cache provides us with, these methods are used to update parts in the cache.

The first one is named `updateQuery`, this method given a query and a result updates
the cache.

```js
const Todos = gql`
  query {
    __typename
    todos {
      __typename
      id
      text
      complete
    }
  }
`;

cache.updateQuery(Todos, data => {
  data.todos.push({
    id: '2',
    text: 'Learn updates and queryResolvers',
    complete: false,
    __typename: 'Todo',
  });
  return data;
});
```

So how to interpret the above code-sample, we supply a query
to the cache, this way it can fetch the required data. Then it
will call your second argument with the data it has queried, you
can now alter this and return it. When you have returned to the
cache it will update the relevant query with your given input.

> Note that you have to supply \_\_typename.

Secondly we have `updateFragment`, this method is mainly meant so
you don't have to supply the full object every time.

```js
cache.updateFragment(
  gql`
    fragment _ on Todo {
      id
      text
    }
  `,
  {
    id: '1',
    text: 'update',
  }
);
```

The way to read this is, we supply a partial `Todo` having `id` or `_id`
so we know what entity you are telling the cache to update and some fields
you want to update. So in this case we update id "1" to have text "update".
The rest of the properties (complete and \_\_typename) will stay untouched.

```js
const cache = cacheExchange({
  updates: {
    addTodo: (result, arguments, cache, info) => {
      cache.updateQuery(Todos, data => {
        data.todos.push(result);
        return data;
      });
    },
  },
});
```

Now that we have gone over all required things to know you can get started
with the urql-graphcache.
