const { ApolloServer, graphiqlExpress } = require('apollo-server-express');
const { createServer } = require('http');
const { SubscriptionServer } = require('subscriptions-transport-ws');
const expressPlayground = require('graphql-playground-middleware-express')
  .default;
const express = require('express');
const app = express();
const cors = require('cors');

const { typeDefs, resolvers } = require('./schema');

const PORT = 3001;

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

server.applyMiddleware({ app });

const webServer = createServer(app);
server.installSubscriptionHandlers(webServer);

const graphqlEndpoint = `http://localhost:${PORT}${server.graphqlPath}`;
const subscriptionEndpoint = `ws://localhost:${PORT}${
  server.subscriptionsPath
}`;

app.use(cors());
app.get(
  '/',
  expressPlayground({
    endpoint: graphqlEndpoint,
    subscriptionEndpoint: subscriptionEndpoint,
  })
);

webServer.listen(PORT, () => {
  console.log(`🚀 Server ready at ${graphqlEndpoint}`);
  console.log(`🚀 Subscriptions ready at ${subscriptionEndpoint}`);
});
