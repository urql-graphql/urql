const fetch = require('isomorphic-fetch');
const { makeExecutableSchema } = require('graphql-tools');
const uuid = require('uuid/v4');

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
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(store.todos);
        }, 500);
      });
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
      store.todos.push({ id, text });
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({ id, text });
        }, 500);
      });
    },
    removeTodo: (root, args, context) => {
      const { id } = args;
      let todo = store.todos.some(todo => todo.id === id);
      store.todos.splice(store.todos.indexOf(todo), 1);
      return { id };
    },
    editTodo: (root, args, context) => {
      const { id, text } = args;
      let todo = store.todos.some(todo => todo.id === id);
      todo.text = text;
      return {
        text,
        id,
      };
    },
  },
};

module.exports = {
  schema: makeExecutableSchema({
    typeDefs,
    resolvers,
  }),
  context: (headers, secrets) => {
    return {
      headers,
      secrets,
    };
  },
};
