import { ApolloServer, gql } from 'apollo-server-micro'

const store = {
  todos: [
    {
      id: 0,
      text: "Go to the shop",
      complete: false
    },
    {
      id: 1,
      text: "Go to school",
      complete: true
    },
    {
      id: 2,
      text: "Use urql",
      complete: false
    }
  ]
};

const typeDefs = gql`
  type Query {
    todos: [Todo]
  }

  type Mutation {
    toggleTodo(id: ID!): Todo
  }

  type Todo {
    id: ID
    text: String
    complete: Boolean
  }
`;

const resolvers = {
  Query: {
    todos: () => store.todos,
  },
  Mutation: {
    toggleTodo: (root, { id }, context) => {
      store.todos[id].complete = !store.todos[id].complete;
      return store.todos[id];
    }
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

export const config = {
  api: {
    bodyParser: false,
  },
}

export default server.createHandler({ path: '/api/graphql' })

