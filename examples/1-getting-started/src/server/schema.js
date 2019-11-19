let idCounter = 2;

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
  type Todo {
    id: ID
    text: String
    complete: Boolean
  }

  type TodoResponse {
    todo: Todo!
    viewer: Query!
  }

  type Query {
    todos: [Todo]
  }

  type Mutation {
    toggleTodo(id: ID!): TodoResponse
    addTodo(text: String!): TodoResponse
    deleteTodo(id: ID!): TodoResponse
  }
`;

const resolvers = {
  Query: {
    todos: () => {
      return store.todos;
    },
  },
  Mutation: {
    toggleTodo: (root, args) => {
      const { id } = args;

      const todo = store.todos.find(t => String(t.id) === id);
      todo.complete = !todo.complete;

      return { todo, viewer: {} };
    },
    addTodo: (root, args) => {
      const id = ++idCounter;
      const todo = { complete: false, id, text: args.text };
      store.todos.push(todo);
      return { todo, viewer: {} };
    },
    deleteTodo: (root, args) => {
      const { id } = args;
      const todo = store.todos.find(t => String(t.id) === id);
      store.todos = store.todos.filter(t => {
        return String(t.id) !== id;
      });
      return { todo, viewer: {} };
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
