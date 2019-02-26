const fetch = require('isomorphic-fetch');

const store = {
  todos: [
    {
      id: 0,
      text: 'Go to the shops',
      complete: false,
    },
    {
      id: 1,
      text: 'Pick up the kids',
      complete: true,
    },
    {
      id: 2,
      text: 'Install urql',
      complete: false,
    },
  ],
};

const typeDefs = `
  type Query {
    todos: [Todo]
  }
  type Mutation {
    toggleTodo(id: ID!): Todo
  }
  type Todo {
    id: ID,
    text: String,
    complete: Boolean,
  }
`;

const resolvers = {
  Query: {
    todos: (root, args, context) => {
      return store.todos;
    },
  },
  Mutation: {
    toggleTodo: (root, args, context) => {
      const { id } = args;
      store.todos[args.id].complete = !store.todos[args.id].complete;
      return store.todos[args.id];
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
