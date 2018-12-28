const fetch = require('isomorphic-fetch');
const uuid = require('uuid/v4');
const { PubSub } = require('graphql-subscriptions');

const pubsub = new PubSub();

const store = {
  todos: [
    {
      id: uuid(),
      text: 'test',
    },
    {
      id: uuid(),
      text: 'test2',
    },
    {
      id: uuid(),
      text: 'test3',
    },
  ],
  user: {
    name: 'Ken',
    age: 32,
  },
};

const typeDefs = `
  type Query {
    todos: [Todo]
    todo(id: ID!): Todo
    user: User
  }
  type Mutation {
    addTodo(text: String!): Todo
    removeTodo(id: ID!): Todo
    editTodo(id: ID!, text: String!): Todo
  }
  type Subscription {
    todoAdded: Todo
    todoRemoved: Todo
    todoUpdated: Todo
  }
  type Todo {
    id: ID,
    text: String,
  }
  type User {
    name: String
    age: Int
  }
`;

const resolvers = {
  Query: {
    todos: (root, args, context) => {
      return store.todos;
    },
    todo: (root, args, context) => {
      return store.todos.find(a => (a.id = args.id));
    },
    user: (root, args, context) => {
      return store.user;
    },
  },
  Mutation: {
    addTodo: (root, args, context) => {
      const id = uuid();
      const { text } = args;
      const todo = { id, text };

      store.todos.push(todo);
      pubsub.publish('todoAdded', { todoAdded: { id, text: { text } } });

      return todo;
    },
    removeTodo: (root, args, context) => {
      const { id } = args;
      let todo = store.todos.find(todo => todo.id === id);
      store.todos.splice(store.todos.indexOf(todo), 1);
      pubsub.publish('todoRemoved', { todoRemoved: todo });
      return { id };
    },
    editTodo: (root, args, context) => {
      const { id, text } = args;
      let todo = store.todos.some(todo => todo.id === id);
      pubsub.publish('todoUpdated', { todoUpdated: todo });
      todo.text = text;
      return {
        text,
        id,
      };
    },
  },
  Subscription: {
    todoAdded: {
      subscribe: () => pubsub.asyncIterator('todoAdded'),
    },
    todoRemoved: {
      subscribe: () => pubsub.asyncIterator('todoRemoved'),
    },
    todoUpdated: {
      subscribe: () => pubsub.asyncIterator('todoUpdated'),
    },
  },
};

module.exports = {
  typeDefs,
  resolvers,
  context: (headers, secrets) => {
    return {
      headers,
      secrets,
    };
  },
};
