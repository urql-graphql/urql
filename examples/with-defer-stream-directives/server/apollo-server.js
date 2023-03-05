const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const { schema } = require('./schema');

const server = new ApolloServer({ schema });

startStandaloneServer(server, {
  listen: {
    port: 3004,
  },
});
