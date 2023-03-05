// NOTE: This currently fails because responses for @defer/@stream are not sent
// as multipart responses, but the request fails silently with an empty JSON response payload

const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const { schema } = require('./schema');

const server = new ApolloServer({ schema });

startStandaloneServer(server, {
  listen: {
    port: 3004,
  },
});
