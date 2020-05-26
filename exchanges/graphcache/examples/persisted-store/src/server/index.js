const { ApolloServer } = require('apollo-server-express');
const cors = require('cors');
const express = require('express');
const { typeDefs, resolvers } = require('./schema');

const PORT = 4000;

// Setup graphql server
const app = express();

app.use(cors());

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

server.applyMiddleware({ app });

app.listen({ port: PORT }, () =>
  console.log(
    `Backend server listening at http://localhost:${PORT}${server.graphqlPath}`
  )
);
